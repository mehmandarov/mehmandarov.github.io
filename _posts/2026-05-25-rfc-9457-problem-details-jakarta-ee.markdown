---
title: "Sane API error handling with RFC 9457 Problem Details in Jakarta EE"
layout: post
date: 2026-05-25 10:00
description: A practical look at RFC 9457 Problem Details for HTTP APIs in Jakarta EE – a hand-made ProblemDetail + ExceptionMapper approach, the Zalando Problem library, and a short note on Quarkus and Spring.
image: '/assets/images/posts-images/error.jpg'
tag:
    - english
    - java
    - architecture
    - api
    - jakarta ee
    - microprofile
    - jax-rs
    - error handling
    - quarkus
    - spring
category: blog
star: false
author: rustam.mehmandarov
---

_When APIs end up with their own error format, it quickly gets annoying for anyone who has to consume more than one API. [RFC 9457][1] defines a standard envelope for HTTP API errors. Let's have a look at how to do it in Jakarta EE: a small hand-made `ProblemDetail` plus one `ExceptionMapper` per error category; with the [Zalando Problem][2] library; followed by quick notes on Quarkus and Spring as alternatives._

- [Introduction](#introduction)
- [TL;DR: Why RFC 9457?](#tldr-why-rfc-9457)
- [Let's write some code!](#lets-write-some-code)
  - [1. Hand-made `ProblemDetail` + `ExceptionMapper`](#1-hand-made-problemdetail--exceptionmapper)
  - [2. Zalando Problem](#2-zalando-problem)
  - [3. Quarkus: `quarkus-http-problem`](#3-quarkus-quarkus-http-problem)
  - [4. Spring Boot – a short note](#4-spring-boot--a-short-note)
- [Conclusion](#conclusion)
- [What's Next?](#whats-next)

---

## Introduction

If you've consumed more than one or two REST APIs, you've seen the pattern. One service returns `{"error": "..."}`, another `{"message": "...", "code": 42}`, a third returns `200 OK` with an error hidden somewhere deep in the response. Your REST client code fills up with special cases for each one. Sounds familiar?

[RFC 9457 – Problem Details for HTTP APIs][1] (the successor to RFC 7807) defines a single JSON envelope for errors, served as `application/problem+json` MIME type. It is a small spec: five well-defined bits of information and an `extensions` map for anything else you might need.

```json
{
  "type": "urn:problem-type:validation-error",
  "title": "Validation Failed",
  "status": 400,
  "detail": "The request body or parameters failed validation.",
  "extensions": {
    "violations": [
      { "field": "title", "message": "Title is required" }
    ]
  }
}
```

## TL;DR: Why RFC 9457?

Why not keep creating your own?

- **Consumers already know the shape.** Generated SDKs, gateways, log pipelines, and tracing tools can parse `application/problem+json` without extra work.
- **You can extend it without breaking clients.** The `extensions` map is part of the spec – put what you need in there.
- **It separates the _category_ from the _instance_.** `type` says "this is a validation error" (stable, machine-readable); `detail` and `instance` describe what happened _this_ time.

💡 _**Note:** RFC 9457 is just a JSON structure and a content type. No library or framework is required. That's why there are so many implementations – and why a hand-made one is often a reasonable choice._

---

## Let's write some code!

I have created a repository called [API Guide for Java][3] to showcase the patterns for one of my talks. For this post, have a look at [`ProblemDetail.java`][4] and the mappers next to it under [`com/mehmandarov/confapi/error/`][5].


### 1. Hand-made `ProblemDetail` + `ExceptionMapper`

#### What it looks like

Imagine you have a REST interface looking like this:

```java
@GET
@Path("/{id}")
@Operation(summary = "Get room by ID")
@APIResponse(responseCode = "200", description = "Room found")
@APIResponse(responseCode = "404", description = "Room not found")
public Room getById(
        @Parameter(description = "Room ID", required = true)
        @PathParam("id") String id) {
    return repo.findById(id)
            .orElseThrow(() -> new NotFoundException("Room not found: " + id));
}
```

Now, you can add a single `ProblemDetail` class – built around the five RFC 9457 elements and an `extensions` map – and one [`ExceptionMapper`][6] per error category.

```java
public class ProblemDetail {
    private URI type = URI.create("about:blank");
    private String title;
    private int status;
    private String detail;
    private URI instance;
    private final Map<String, Object> extensions = new LinkedHashMap<>();

    public static ProblemDetail of(int status, String title) { /* ... */ }
    public ProblemDetail withType(String typeUri)            { /* ... */ }
    public ProblemDetail withExtension(String key, Object v) { /* ... */ }
    // + getters/setters
}
```

The interesting part is how it gets used. As you can see from the resource code above, there is **no `try/catch` in resources, ever** – every exception is turned into a Problem Details response by an `ExceptionMapper`:

```java
@Provider
public class ConstraintViolationExceptionMapper
        implements ExceptionMapper<ConstraintViolationException> {

    @Override
    public Response toResponse(ConstraintViolationException ex) {
        List<Map<String, String>> violations = ex.getConstraintViolations()
                .stream().map(this::toMap).toList();

        ProblemDetail problem = ProblemDetail.of(400, "Validation Failed")
            .withType("urn:problem-type:validation-error")
            .withExtension("violations", violations);

        return Response.status(400)
                .type("application/problem+json")
                .entity(problem).build();
    }
}
```

One mapper per category keeps each file small and obvious: `ConstraintViolationExceptionMapper` → 400, `NotFoundExceptionMapper` → 404, `NotAuthorizedExceptionMapper` → 401, `ForbiddenExceptionMapper` → 403, and a `CatchAllExceptionMapper` → 500 that **never leaks stack traces** to clients.

⚠️_**A word of caution:** The catch-all mapper is the safety net for everything you forgot to handle. Without one, an uncaught exception ends up in the server's default error page, which often includes stack traces, server versions, and sometimes filesystem paths. However, it might be a good idea to handle most of the common exceptions explicitly, and leave the generic catch-all for something truly unexpected._

**✅ Pros:**

- **Portable across runtimes.** The same code runs on Quarkus, Helidon, and Open Liberty. No runtime-specific extension.
- **No extra dependencies.** RFC 9457 is just a JSON structure; you don't need a library to emit one.
- **Small, readable surface.** The error model fits on one slide. When something goes wrong, you can read the source.

**❌ Cons:**

- You write the boilerplate yourself – one mapper per category.
- Nothing maps validation, `WebApplicationException`, or uncaught `Throwable` automatically – you wire each one up. (This can also be one of the pros, depending on the way you look at things.)
- No content negotiation between `application/json` and `application/problem+json` unless you add it yourself. (Spring, for example, has a built-in `ProblemDetail` that does this for you.)


💡 _**Want to know more?** The full code, including all five mappers, lives in [`com/mehmandarov/confapi/error/`][5]._

---

### 2. Zalando Problem

#### What it looks like

The [Zalando Problem][2] library (`org.zalando:problem` + `jackson-datatype-problem`) gives you `Problem` and `ThrowableProblem` types and Jackson serialization. You still write an `ExceptionMapper` to bridge JAX-RS exceptions to `Problem`, but you don't define the envelope yourself.

```java
import org.zalando.problem.Problem;
import org.zalando.problem.Status;

Problem problem = Problem.builder()
        .withType(URI.create("urn:problem-type:validation-error"))
        .withTitle("Validation Failed")
        .withStatus(Status.BAD_REQUEST)
        .with("violations", violations)
        .build();

return Response.status(400)
        .type("application/problem+json")
        .entity(problem).build();
```

**✅ Pros:**

- **Cross-runtime.** Works on Quarkus, Helidon, and Open Liberty – the same artifact deploys on all three.
- **Used in production at Zalando** (and elsewhere); the model handles `cause` chains, stack-trace processing, and a few edge cases you probably would not have thought of upfront.
- **Jackson integration is done for you** via `jackson-datatype-problem`.

**❌ Cons:**

- One more dependency to track and upgrade.
- You still write the `ExceptionMapper`s – the library standardises the _payload_, not the _wiring_.
- If your stack is JSON-B rather than Jackson, you have a bit of extra work.

---

### 3. Quarkus: `quarkus-http-problem`

If you're _only_ targeting Quarkus, the [`quarkus-http-problem`][7] Quarkiverse extension is the shortest path. It auto-maps `ConstraintViolationException`, `WebApplicationException`, and uncaught `Throwable` to `application/problem+json` with no boilerplate from you.

**✅ Pros:**

- Add the dependency and you get Problem Details for exceptions. No need to write a mapper for each of them.
- Reasonable defaults for validation and security exceptions.

**❌ Cons:**

- **Quarkus only.** Doesn't help on Helidon (Jersey) or Open Liberty (CXF). If "runs on every Jakarta runtime" is a requirement, this is out.
- Less visibility into _what_ gets mapped to _what_ – fine until you need to override a default.

---

### 4. Spring Boot – a short note

For completeness, we need to mention Spring Boot 3+ as well, which has Problem Details built in as [`org.springframework.http.ProblemDetail`][8], with content negotiation and `@ExceptionHandler` integration already wired up. If you're on Spring, just use it. The JSON structure is the same RFC 9457; only the wiring differs.

---

## Conclusion

The point of RFC 9457 is not that there's one correct implementation – there are several reasonable ones – but that there's one correct envelope. Once your API speaks `application/problem+json`, clients stop hand-coding error parsers for each new service they consume.

A few rules of thumb:

- On **Spring**, use the built-in `ProblemDetail`.
- On **Quarkus only**, reach for `quarkus-http-problem` and move on.
- For **cross-runtime Jakarta**, choose between **Zalando Problem** (one dependency, more handled for you) and the **hand-made** approach (no dependencies, about 30 lines you fully understand).

I picked the hand-made approach for the demo project because portability across Quarkus, Helidon, and Open Liberty mattered, and because the `ExceptionMapper` _is_ the demo – hiding it behind a library would have defeated the point of the talk.

However, "hand-made" doesn't have to mean "everyone reinvents it from scratch". Write it once, put it in a small internal library, and reuse it across services. That's still less code than wiring up a third-party dependency in each runtime.

### Summary Comparison

| Option                      | What it gives you                                                                       | Runtimes                                       | Dependency cost |
|-----------------------------| --------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------- |
| **Hand-made** _(this post)_ | ~30-line `ProblemDetail` + one mapper per error category.                               | &nbsp;✅ Quarkus &nbsp;✅ Helidon &nbsp;✅ Open Liberty | None            |
| **Zalando Problem**         | `Problem` / `ThrowableProblem` types + Jackson serialization. You still write the mappers. | &nbsp;✅ Quarkus &nbsp;✅ Helidon &nbsp;✅ Open Liberty | 1–2 artifacts   |
| **`quarkus-http-problem`**  | Auto-maps validation, `WebApplicationException`, and uncaught `Throwable`. No boilerplate. | &nbsp;✅ Quarkus only                                 | 1 extension     |
| **Spring `ProblemDetail`**  | Built into the framework. Content negotiation and `@ExceptionHandler` integration.      | &nbsp;✅ Spring Boot 3+                               | None (built in) |
{:.bordered-table}

## What's Next?

Error handling is one of the bonus topics in the [API Guide for Java][3]. The same repo also covers OpenAPI documentation, security (RBAC, JWT), pagination, async, and versioning strategies – see my earlier post on [API versioning in Java using JAX-RS][9].

**_Happy shipping of well-formed error messages, folks!_**

---
[1]: https://www.rfc-editor.org/rfc/rfc9457
[2]: https://github.com/zalando/problem
[3]: https://github.com/mehmandarov/api-guide-java
[4]: https://github.com/mehmandarov/api-guide-java/blob/main/src/main/java/com/mehmandarov/confapi/error/ProblemDetail.java
[5]: https://github.com/mehmandarov/api-guide-java/tree/main/src/main/java/com/mehmandarov/confapi/error
[6]: https://jakarta.ee/specifications/restful-ws/4.0/apidocs/jakarta.ws.rs/jakarta/ws/rs/ext/exceptionmapper
[7]: https://github.com/quarkiverse/quarkus-http-problem
[8]: https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/ProblemDetail.html
[9]: {% post_url 2026-04-19-api-versioning %}

