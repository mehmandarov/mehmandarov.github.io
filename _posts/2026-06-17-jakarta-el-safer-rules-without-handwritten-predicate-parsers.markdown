---
title: "Jakarta EL: safer rules without handwritten predicate parsers"
layout: post
date: 2026-06-17 16:17
description: A practical look at Jakarta Expression Language as a small in-process policy engine – replacing a handwritten predicate parser with `jakarta.el.ELProcessor`, then hardening evaluation with a resolver whitelist and timeout.
image: '/assets/images/posts-images/books.jpg'
tag:
    - english
    - java
    - jakarta ee
    - security
    - architecture
category: blog
star: false
author: rustam.mehmandarov
---

_[Jakarta Expression Language][1] (EL) is already part of the platform, but we usually meet it indirectly through Faces, CDI, or Bean Validation. In this post, we will use it directly: as a small in-process predicate engine for authorization policies. We will replace the handwritten parser, keep the same policy file format, and then look at what it takes to make evaluation safe._

- [Introduction](#introduction)
- [1. Why Jakarta EL?](#1-why-jakarta-el)
    - [1.1 From handwritten predicate parser to EL](#11-from-handwritten-predicate-parser-to-el)
- [2. We need to talk about the security](#2-we-need-to-talk-about-the-security)
    - [2.1 How dangerous can it be? Why bother validating the input?](#21-how-dangerous-can-it-be-why-bother-validating-the-input)
    - [2.2 Adding security to the expressiveness](#22-adding-security-to-the-expressiveness)
    - [2.3 Replacing the parser/evaluator with Jakarta EL](#23-replacing-the-parserevaluator-with-jakarta-el)
- [3. Trade-offs and when to use what](#3-trade-offs-and-when-to-use-what)
    - [3.1 What ships today vs. where we're headed](#31-what-ships-today-vs-where-were-headed)
    - [3.2 Is the swap worth it?](#32-is-the-swap-worth-it)
    - [3.3 Summary comparison](#33-summary-comparison)
- [Conclusion](#conclusion)
- [What's Next?](#whats-next)

---

## Introduction

If you've written Jakarta EE for any length of time, you've used Jakarta Expression Language (EL) whether you noticed it or not. Every `#{bean.name}` in a Faces (JSF) page, and every `${validatedValue}` in a Bean Validation constraint message, is EL under the hood – a small expression language sitting underneath much of the platform.

Quick terminology note before we go further: in this post, a **predicate** is just the boolean condition part of a rule – the bit that answers "does this speaker get to see this event?". The whole JSON object is the rule; the `predicate` field is the expression inside that rule.

What EL is genuinely good at is being a JavaBean-aware predicate language inside your own app. Because expressions are just strings, EL also fits neatly into policy files that your app already hot-reloads. You don't have to write a parser, you don't have to pull in dependencies like Drools or OPA – `jakarta.el.ELProcessor` is part of Jakarta Expression Language, which ships with Jakarta EE runtimes, and you can call it directly from your Java code.

If you have heard of Jakarta EL, you might have also heard that EL has a reputation for danger. However, that reputation is mostly about untrusted or insufficiently validated input reaching an evaluator with too much access – not about EL being uniquely dangerous by itself. The handful of CVEs behind the reputation were patched years ago in supported versions, but the lesson behind them still applies to any string you "evaluate" in any language or framework.

We'll build something useful with EL first. Later, we will look at the potential security issues and their mitigation, and how you can make it safe by restricting what EL can access with a custom `ELResolver`.

## 1. Why Jakarta EL?

Surprisingly often, people end up implementing and re-implementing small DSL parsers for policy expressions. Oftentimes, it turns out to be a subset of what Jakarta EL can offer. EL gives you the following, for free, out of the box:

- **JavaBean-style and `Map`-backed property access**. EL natively understands standard `getX()` getters, and resolves `a.b` against `Map` keys just as happily. In this demo we flatten `speaker` and `event` into small per-call maps before evaluation, so `speaker.languages` or `event.cfpDeadline` resolves a map entry – no extra mapping code, and no domain record methods left exposed to the expression.
- **Method calls** on the object graph. You can also call methods on what you _do_ expose – e.g. `event.cfpDeadline.isAfter(...)` on a `LocalDate` value.
- **Standard arithmetic and boolean operators**. You can use `&&`, `||`, `==`, `!=`, `<`, `>`, `+`, `-`, `*`, `/`, `%` out of the box.
- **`empty`, `not`, and ternary `? :`** for shorter and more flexible expressions.
- A pluggable [`ELResolver`][4] chain that lets you **decide what is and isn't reachable** from an expression.

**Important note:** The last bullet point is the one this post is _really_ about. Raw EL evaluation can be dangerous if the resolver chain exposes too much: `getClass()`, reflection, runtime classes, and other things you do not want policy expressions to reach. EL becomes *safer* once you restrict what the resolver chain can access.

---

### 1.1 From handwritten predicate parser to EL

Let's look at an example from gem #2 of my [Jakarta EE Hidden Gems][5] demo code. There, authorization rules live in a [JSON policy file][13]. Gem #2 used a handwritten predicate parser/evaluator; this post – gem #3 – keeps the same predicates and the same `rules.json` format, but swaps the evaluator behind them for an EL-based one. The enforcement path still goes through the same [`@RolesAllowed` + JAX-RS ABAC filter][2]:

```json
{
  "rules": [
    {
      "subject":   "role:SPEAKER",
      "action":    "GET",
      "resource":  "/api/events/*",
      "predicate": "speaker.languages intersects event.languages && speaker.tracks intersects event.tracks"
    }
  ]
}
```

Here, each rule carries a `predicate` string, evaluated by a tiny [handwritten parser][3] – deliberately limited to four operators (`intersects`, `contains`, `==`, `!=`) joined only by a top-level `&&`, with no nesting, method calls, or functions. Even at that size, the implementation is more complex than you'd expect. Here's just the reference-resolution helper (note: the whole file is linked above):

```java
private static Object resolve(String ref, Map<String, Object> ctx) {
    if (ref.isEmpty()) return null;
    char c0 = ref.charAt(0);

    if (c0 == '"' || c0 == '\'') {
        return ref.substring(1, ref.length() - 1);
    }
    if (Character.isDigit(c0) || c0 == '-') {
        try { return Long.parseLong(ref); } catch (NumberFormatException ignored) {}
        try { return Double.parseDouble(ref); } catch (NumberFormatException ignored) {}
    }
    return switch (ref) {
        case "true"  -> Boolean.TRUE;
        case "false" -> Boolean.FALSE;
        case "null"  -> null;
        default -> {
            String[] segments = ref.split("\\.");
            Object cur = ctx.get(segments[0]);
            for (int i = 1; i < segments.length && cur != null; i++) {
                cur = property(cur, segments[i]);
            }
            yield cur;
        }
    };
}
```

And that's just one of several methods: a top-level `&&` splitter, a per-clause evaluator, an operator enum with collection-aware `intersects`/`contains`, and JavaBean/record reflection hiding inside `property(...)`. About 160 lines total, and every line has to grow if a policy author asks for `||`, dates, or any function call.

Now, what if we swap the evaluator with a [`jakarta.el.ELProcessor`][14] while keeping the same `rules.json` format? That gives us room for rules the old parser could not express:

```json
{
  "rules": [
    {
      "subject":   "role:SPEAKER",
      "action":    "GET",
      "resource":  "/api/events/*",
      "predicate": "speaker.languages intersects event.languages && fn.daysUntil(event.cfpDeadline) > 7"
    }
  ]
}
```

And the EL-based evaluator itself is actually shorter than the handwritten parser it replaces (as we'll see in the [`ElPredicateEngine`][11] code below). Note that the policy syntax stays unchanged. Gem #3 rewrites `intersects` into a helper-function call, so old rules still work while new rules can use things like *date arithmetic* through the `fn` helper bean. As a bonus, this fits the existing policy reload mechanism – edit the policy file, let the `WatchService` reload it, and the new predicate is in effect without a redeploy.

There is a catch, though. If you can *evaluate* almost anything, you can *run* almost anything. You might think, "So what?" Well, consider one of the seemingly innocent tools at your disposal: `getClass()`. In permissive resolver setups, exposing arbitrary object graphs can let an expression walk from `getClass()` into reflection APIs. Written as plain Java, the kind of chain you are trying to prevent looks like this:

```java
// The reflection chain reachable from getClass(), written out in Java.
// Reaching System.exit(...) tears down the whole JVM, and the app server with it.
"".getClass().forName("java.lang.System")
   .getMethod("exit", int.class)
   .invoke(null, 1);
```

## 2. We need to talk about the security

### 2.1 How dangerous can it be? Why bother validating the input?

EL's reputation comes from a handful of CVEs, and they're worth knowing – not because current patched versions should still behave that way, but because they share one shape: **a string the application treated as a label or a template was actually an EL expression, built from unvalidated user input.**

The textbook example is three lines of Bean Validation that shipped in tutorials all over the internet:

```java
public class CreateTalkRequest {
    @Size(max = 10, message = "${validatedValue} is too long")
    private String title;
}
```

Looks innocent. It is "just" an error message, right? But `validatedValue` is the user-provided value (`title` in this case), and Bean Validation message templates go through an interpolator that understands EL. The important nuance is that the constant template above is not, by itself, the whole vulnerability story in modern patched providers. The dangerous shape is when user-controlled text is allowed to become part of the message template, or to escape into template evaluation, instead of being treated as plain text. With the wrong combination of code and provider version, that meant **remote code execution via a validation error message**. That was the shape of [CVE-2020-10693][6] in Hibernate Validator – fixed back in 2020 by interpolating against a constant template.

Two that are worth recognising by name, both long since patched:

- **[CVE-2020-10693][6]** – Hibernate Validator: user input passed straight into a constraint-message template (via an interpolation bypass).
- **[CVE-2017-1000486][8]** – PrimeFaces: an encrypted JSF parameter intended to hold EL was compromised due to a weak default key, allowing attackers to forge and execute arbitrary EL expressions on the server.

And to be clear, this is not a problem unique to Jakarta EL. Other expression languages face the same risk when evaluated against untrusted input. For example, **[CVE-2018-1273][7]** was a very similar RCE in Spring Data, but it happened via SpEL (Spring Expression Language), not Jakarta EL.

The lesson is *not* "avoid EL". It's the same lesson as SQL injection, command injection, and every other injection class: **never feed unvalidated input to an evaluator.** The `SafeELEvaluator` is exactly how you act on that lesson – the predicates come from a trusted policy file, the resolver whitelist decides what's reachable, and a watchdog caps execution time.

_**Caution:** If you ever find yourself writing `String message = "..." + userInput + "..."` and then handing the result to anything called `interpolate`, `evaluate`, or `process`, stop. That's the shape every one of the CVEs above has in common – and it's a property of the input, not of EL._

### 2.2 Adding security to the expressiveness

So how do you get EL's expressiveness without the danger? In the repo there are two EL-based variants. [`ElPredicateEngine`][11] is the pragmatic gem #3 default: it keeps gem #2's policy syntax, rewrites `intersects` and `contains` to helper calls, and uses a fail-closed denylist. [`SafeELEvaluator`][15] is the hardened version: pure EL, a type-whitelisting resolver, a resolution budget, and a timeout. The first one shows the migration path; the second one is the shape you want when you care about the sandbox.

You've seen that raw EL evaluation can be permissive, and a default resolver chain may resolve things like `getClass()` if you expose the wrong object graph. When you want EL purely as a predicate language, the fix is to **add a restricted resolver** that refuses to reach those types in the first place. With `ELProcessor`, installing a custom resolver is only a few lines of code. Writing the resolver carefully is the important part:

```java
public final class SafeELEvaluator {

    private final ELProcessor template;   // pre-built once; reused per call

    public SafeELEvaluator() {
        this.template = new ELProcessor();
        this.template.getELManager().addELResolver(new SafeELResolver());
        // SafeELResolver:
        //   - whitelists base types (Map, Collection, CharSequence, Number,
        //     Boolean, the java.time types, and the `fn` helper); domain
        //     records are flattened to maps, so EL never touches domain methods
        //   - blocks .class / getClass / forName / Runtime / System / Thread / exit
        //   - blocks method invocation through the resolver where needed
        //   - caps the number of resolutions per evaluation (a DoS budget)
    }

    public boolean evaluate(String predicate, Speaker speaker, ConfEvent event) {
        ELProcessor el = cloneTemplate();          // cheap; per-call processor
        el.defineBean("speaker", toMap(speaker));  // per-call map; no domain methods exposed
        el.defineBean("event",   toMap(event));
        return runWithTimeout(50, MILLISECONDS,
                () -> Boolean.TRUE.equals(el.eval(predicate)));
    }
}
```

Three things are doing the work here:

1. **`defineBean(...)`** binds *just* the roots the policy can see – and binds `speaker` and `event` as small per-call maps, so there are no domain record methods left to navigate. Nothing else from the application is reachable.
2. **A custom `ELResolver`**, registered before the defaults, **rejects** any property lookup that would reach `getClass`, `java.lang.*`, or types that are not on the whitelist. Writing a strict-enough `ELResolver` is the part that is easy to under-think. Whitelist *types* (not packages), block method invocation through the resolver where needed, refuse anything that smells like `class`, `getClass`, or `forName`. When in doubt, deny.
3. **A wall-clock timeout** caps how long a single predicate can run. A predicate that triggers expensive resolution, deep nesting, or recursive helper calls is a denial-of-service vector even when it can't escape the sandbox.

_**Note:** the `SafeELEvaluator` above is simplified for the post – the [shipped class][15] builds a fresh `ELProcessor` per call, installs a new [`SafeELResolver`][16] at the front each time, imports the allowed JDK time types, and runs every evaluation through the [`Timeouts`][17] helper. See the [real code][15] for the full picture._

### 2.3 Replacing the parser/evaluator with Jakarta EL

Gem #2's `PredicateEngine` is a concrete CDI bean (it delegates to the handwritten `PredicateEvaluator`), and `ElPredicateEngine` plugs in ahead of it via a globally-enabled CDI `@Alternative` + `@Priority` – the portable, *Quarkus-friendly* equivalent of `@Specializes`. Quarkus's CDI engine, Arc, does not support `@Specializes`, so the `@Alternative` route is what keeps the same gem source running unchanged on Liberty, Helidon **and** Quarkus.

```java
@Alternative
@Priority(1)
@ApplicationScoped
public class ElPredicateEngine extends PredicateEngine {
    @Override
    public boolean evaluate(String predicate, Speaker speaker, ConfEvent event) {
        if (predicate == null || predicate.isBlank()) return true;   // empty == allow
        String el = toEl(predicate);                  // rewrite gem #2's infix operators
        if (BLOCKED.matcher(el).find()) return false; // fail-closed denylist
        try {
            ELProcessor p = new ELProcessor();
            p.defineBean("speaker", toMap(speaker));  // per-call maps; no domain methods exposed
            p.defineBean("event",   toMap(event));
            p.defineBean("fn",      FUNCTIONS);       // helper functions
            return Boolean.TRUE.equals(p.eval(el));
        } catch (RuntimeException e) {
            return false;                             // malformed/blocked predicate → deny
        }
    }
}
```

The handwritten `PredicateEvaluator` from gem #2 stays exactly as it shipped – the `@Alternative` swaps the *engine* behind the same `AccessPolicy`, so nothing downstream changes. Old rules keep working because `toEl(...)` rewrites gem #2's infix `intersects`/`contains` operators into `fn.*` calls before evaluation – Jakarta EL has no infix `intersects`, so it's that small translation step, not native parsing, that preserves backward compatibility.

---

## 3. Trade-offs and when to use what

### 3.1 What ships today vs. where we're headed

Gem #3 in [the repo][5] ships *both* engines. The running default, [`ElPredicateEngine`][11] from above, exposes `speaker` and `event` as small per-call maps (so policy expressions do not navigate the domain records directly), runs a fail-closed *denylist* over the expression, and adds a small `fn` helper bean (`fn.daysUntil(...)`, `fn.intersects(...)`). That is the pragmatic baseline you can run right now.

Shipping right next to it is the *hardened* [`SafeELEvaluator`][15] from above – a real [`SafeELResolver`][16] that whitelists *types* instead of denylisting strings, plus a per-call wall-clock timeout (the [`Timeouts`][17] helper, since EL has no execution budget of its own). The denylist gets you started; the resolver is where you want to be.

### 3.2 Is the swap worth it?

So, is swapping the handwritten parser/evaluator for a sandboxed `ELProcessor` worth it? Here's how the trade-offs net out:

**✅ Pros:**

- **No parser to maintain.** `ELProcessor` ships with the platform; you delete the hand-rolled tokeniser, operator enum, and reflection helper.
- **Comparable size for the baseline, and the rules carry over.** The denylist `ElPredicateEngine` (~110 lines) plus its `fn` helpers lands in the same ballpark as the ~160-line parser it replaces, and gem #2's existing rules keep working unchanged.
- **Fits hot-reloadable policy files.** EL is a string; the policy file is a string; pair them with a `WatchService` and you have live policy edits.
- **Richer policies without redeploys.** Date arithmetic, member access, even ternaries are all available.
- **The sandbox is local and auditable.** Your `SafeELResolver` is the only thing that decides what's reachable, and you can read it on one screen.

**❌ Cons:**

- You're now responsible for the resolver whitelist. Get it wrong and you are back in [unvalidated-input territory](#21-how-dangerous-can-it-be-why-bother-validating-the-input).
- **The hardened path is more code, not less.** The whitelist `SafeELResolver` (~190 lines) plus the `Timeouts` watchdog is larger than the parser – you're trading raw line count for a single, auditable security surface.
- A malformed predicate still fails *closed* – the engine wraps `eval(...)` in a `try/catch` that denies and logs a warning – but the logged reason reads like an EL error, not your own. Map `ELException` to a friendlier "rule X failed to evaluate" if your operators care.
- A [timeout watchdog][17] is **not optional**. EL has no built-in execution budget.

### 3.3 Summary comparison

| Option                                          | What it gives you                                                                                       | Surface to audit                                | When to reach for it |
|-------------------------------------------------|---------------------------------------------------------------------------------------------------------|-------------------------------------------------|----------------------|
| **Handwritten `PredicateEvaluator`** _(gem #2)_ | A strict four-operator subset. No nesting, no method calls.                                             | ~160 lines of parser + reflection.              | When you want a tiny evaluator surface and accept the feature ceiling. |
| **`ElPredicateEngine`** _(gem #3 default)_      | EL-backed predicates, old `intersects`/`contains` rules rewritten to `fn.*`, plus a fail-closed denylist. | ~110-line engine + helper functions + denylist. | When you want the migration path and backwards compatibility with gem #2 rules. |
| **`SafeELEvaluator`** _(hardened path)_         | Full EL semantics, restricted to whitelisted types and bound beans, with a per-call timeout.            | ~190-line `ELResolver` + a watchdog (`Timeouts`). | When policy authors need more than four operators and you can own the resolver. |
| **Raw `ELProcessor`**                           | Full EL, default resolver chain, no timeout.                                                            | Default resolver chain + everything reachable from exposed objects. | **Don't**, unless every input is application-controlled. |
| **Drools / OPA / Cedar**                        | A real rules engine with its own language, debugger, and tooling.                                       | An external service or a multi-MB dependency.   | When your rules language is the product, not a side quest. |
{:.bordered-table}

---

## Conclusion

There is no silver bullet for "embed a small rules language in a Jakarta app", but there is a workable progression:

- For **a handful of trivial predicates**, the handwritten approach from gem #2 is honest about its limits and has a tiny evaluator surface. Ship it, move on.
- For **anything that wants method calls, date arithmetic, or member access**, an EL-backed evaluator is, in my opinion, a good trade. The pragmatic `ElPredicateEngine` replaces the parser with a similarly sized, more capable engine while keeping the policy file format the same. The hardened path may not reduce line count, but it moves the risk into one resolver and one timeout boundary – a smaller and more auditable security surface.
- For **a rules language that is the product** (think compliance engines, fraud rules, complex insurance policies), reach for Drools or OPA. EL is not trying to be that.

You may have heard about CVEs related to Jakarta EL, and those issues were real. The pattern behind the named issues was *unvalidated input* reaching an evaluator with too much access, and they were patched years ago in supported versions. "Don't feed user input to a `${...}`" is a rule that bears repeating – but it's the same rule as for SQL or the shell, not something peculiar to EL. Once you own the resolver chain and only ever evaluate trusted policy strings, EL stops being a liability and turns into a fairly under-used corner of the platform.

I picked the sandboxed-EL approach for the demo because it does what the rest of the series cares about: **less custom code, more standard platform, no runtime-specific extension**. Gem #3 ships it as `ElPredicateEngine` and it hardens into `SafeELEvaluator` – and the same engine runs unchanged on Quarkus, Helidon, and Open Liberty.

## What's Next?

If REST API design is your thing, my posts on [API versioning][9] and [RFC 9457 Problem Details][10] are also worth a look. The full code for this post – both engines, the resolver, and the watchdog – lives in gem #3 of the [Jakarta EE Hidden Gems][5] repository. Also, keep an eye on the [Jakarta EE tag][12] here in general.

**_Happy (and safe) evaluating, folks!_**

---
[1]: https://jakarta.ee/specifications/expression-language/
[2]: https://github.com/mehmandarov/jakarta-hidden-gems/blob/main/02-authorization/src/main/java/com/mehmandarov/jhg/authz/AccessPolicy.java
[3]: https://github.com/mehmandarov/jakarta-hidden-gems/blob/main/02-authorization/src/main/java/com/mehmandarov/jhg/authz/PredicateEvaluator.java
[4]: https://jakarta.ee/specifications/expression-language/6.0/apidocs/jakarta.el/jakarta/el/elresolver
[5]: https://github.com/mehmandarov/jakarta-hidden-gems
[6]: https://nvd.nist.gov/vuln/detail/CVE-2020-10693
[7]: https://nvd.nist.gov/vuln/detail/CVE-2018-1273
[8]: https://nvd.nist.gov/vuln/detail/CVE-2017-1000486
[9]: {% post_url 2026-04-19-api-versioning %}
[10]: {% post_url 2026-05-25-rfc-9457-problem-details-jakarta-ee %}
[11]: https://github.com/mehmandarov/jakarta-hidden-gems/blob/main/03-el-policy/src/main/java/com/mehmandarov/jhg/el/ElPredicateEngine.java
[12]: {{ '/tag/jakarta-ee/' | relative_url }}
[13]: https://github.com/mehmandarov/jakarta-hidden-gems/blob/main/policy/rules.json
[14]: https://jakarta.ee/specifications/expression-language/6.0/apidocs/jakarta.el/jakarta/el/elprocessor
[15]: https://github.com/mehmandarov/jakarta-hidden-gems/blob/main/03-el-policy/src/main/java/com/mehmandarov/jhg/el/SafeELEvaluator.java
[16]: https://github.com/mehmandarov/jakarta-hidden-gems/blob/main/03-el-policy/src/main/java/com/mehmandarov/jhg/el/SafeELResolver.java
[17]: https://github.com/mehmandarov/jakarta-hidden-gems/blob/main/03-el-policy/src/main/java/com/mehmandarov/jhg/el/Timeouts.java
