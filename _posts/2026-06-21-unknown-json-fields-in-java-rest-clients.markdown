---
title: "Unknown JSON fields in Java REST clients: JSON-B, Jackson, Quarkus, and Spring Boot"
layout: post
date: 2026-06-21 09:00
description: What happens when a JSON response contains more fields than your DTO declares? The answer depends on your JSON provider. A look at the defaults for JSON-B, Jackson, Quarkus, and Spring when consuming an API with the MicroProfile REST Client – with the official docs to back each one up.
image: '/assets/images/posts-images/computers.jpg'
tag:
    - english
    - java
    - api
    - jakarta ee
    - microprofile
    - jax-rs
    - quarkus
    - rest client
    - spring boot
category: blog
star: false
author: rustam.mehmandarov
---

_You call an API with the MicroProfile REST Client, map the response onto a small DTO, and one day the API starts returning a few extra fields you never asked for. Does your client shrug and carry on, or does it blow up with a deserialization error? The honest answer is "it depends on your JSON provider" – and the defaults are not the same across the board. Let's pin down what actually happens, and point to the spec or docs for each case._

## Introduction

Imagine a small REST client. You are consuming a "room" resource from some conference API, and you only care about three fields – `id`, `name`, and `capacity`:

```java
public record Room(String id, String name, int capacity) { }
```

You wire it up with the [MicroProfile REST Client][1]:

```java
@RegisterRestClient(baseUri = "https://conf.example.com/api")
public interface RoomsClient {

    @GET
    @Path("/rooms/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    Room getById(@PathParam("id") String id);
}
```

This works fine. Then, a few sprints later, the API team **adds** `building`, `floor`, and `accessibility` to the room payload. Your DTO still declares three fields. The response now looks like this:

```json
{
  "id": "room-7",
  "name": "Hall A",
  "capacity": 120,
  "building": "Main",
  "floor": 2,
  "accessibility": { "wheelchair": true }
}
```

The question is simple: what does `getById("room-7")` do now? And the answer, annoyingly, is that it depends entirely on which JSON provider is doing the deserialization. The MicroProfile REST Client spec does not decide this for you – it delegates the actual JSON binding to whatever provider is on the classpath.

## Why this bites people

This is worth a whole post because the default behaviour is _inconsistent_ between providers, and the failure shows up at the worst possible time – in production, when someone else's API changes underneath you.

A JSON library can reasonably do one of two things when it meets a field that has no home in your DTO:

- **Be lenient (tolerant reader):** ignore the unknown field and move on. This means an additive change on the server side does not break your client.
- **Be strict:** treat an unknown field as a mistake worth reporting, and throw.

This idea is not something REST people invented later. It goes back to early Internet protocol design: TCP's [robustness principle][15] ([overview][2]) says to be conservative in what you send and liberal in what you accept from others. For this particular JSON-client case, the practical reading is simple: if the response gives you all the fields you asked for, extra fields should usually be ignored by the consumer. The modern caveat is important, though: this is not a license to accept malformed or unsafe input. Newer [protocol guidance][16] explicitly warns that applying the robustness principle too broadly can create interoperability and security problems.

Neither is wrong. But you really want to _know_ which one you have, because the strict default is the one that turns a backwards-compatible server change into a client-side outage.

> 💡 _**Note:** "Additive response changes should be safe" is one of the practical compatibility expectations of REST-style JSON APIs. It only holds if your consumers are tolerant readers. A strict deserializer quietly opts you out of that contract._

## Show me the code

I have added a small demo to my [API Guide for Java][3] repository. The endpoint in [`UnknownFieldsResource.java`][4] serves a deliberately over-stuffed room payload at `GET /api/unknown-fields/{id}` (the six fields from the introduction), and the [`Ch7_UnknownFieldsTest`][5] unit test shows what each provider does when that payload is mapped onto the three-field `Room`. Below, I walk through the defaults and the switch that changes each one.

---

## 1. The default: JSON-B (Yasson)

### What it looks like

On a typical Jakarta EE / MicroProfile stack without Jackson – think Open Liberty, Helidon, Payara, and friends – JSON mapping is commonly handled through **JSON-B**. [Yasson][6] is the JSON-B reference implementation, and it is also what the demo test uses.

The good news: JSON-B **ignores unknown properties by default**. The `Room` record above deserializes happily, `building` and `floor` are dropped on the floor, and your client keeps working.

This is not an accident or an implementation detail of Yasson – it is in the spec. The [Jakarta JSON Binding specification][7] states that during deserialization, any JSON property that does not map to a class member is ignored.

### How to call it

```bash
curl -X GET http://localhost:8080/api/unknown-fields/room-7 \
  -H "Accept: application/json"
```

```text
GET http://localhost:8080/api/unknown-fields/room-7
Accept: application/json
```

The HTTP endpoint still returns the six-field payload. The important part happens on the client side: JSON-B maps the fields it knows about into `Room` and ignores `building`, `floor`, and `accessibility`.

**✅ Pros:**
- Tolerant reader by default – additive server changes don't break you.
- No configuration needed; it's the platform default.
- Matches the behaviour most people _expect_ from a REST client.

**❌ Cons:**
- If you _want_ strictness (e.g. to catch a typo in a field name during development), JSON-B gives you less help there.
- Silently dropping fields can hide the fact that the API has grown, and you're missing data you might actually want.

🔍 _**However:** "Lenient by default" is the behaviour you usually want for a consumer. Just be aware it is a deliberate choice – you are trading early failure for compatibility._

---

## 2. Jackson: strict by default

### What it looks like

The moment you use an unconfigured Jackson mapper or a bare Jackson provider – for example a plain `ObjectMapper`, `resteasy-jackson`, or `jersey-media-json-jackson` without framework-level configuration – the default **flips**.

Jackson's `ObjectMapper` enables [`DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES`][8] **by default**. An unknown field throws `UnrecognizedPropertyException` (a subclass of `JsonMappingException`), which typically surfaces through the REST Client as a response-processing/deserialization failure. Your three-field `Room` no longer deserializes the six-field payload – it fails.

There are three common ways to make Jackson lenient, from most local to most global:

```java
// 1. Per DTO/type - the local fix:
@JsonIgnoreProperties(ignoreUnknown = true)
public record Room(String id, String name, int capacity) { }
```

```java
// 2. Per ObjectMapper - the application-wide fix:
ObjectMapper mapper = JsonMapper.builder()
        .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
        .build();
```

For the MicroProfile REST Client specifically, you'd expose that configured `ObjectMapper` through a `ContextResolver<ObjectMapper>` so the client picks it up:

```java
// 3. Hand the configured mapper to the REST Client via a ContextResolver:
@Provider
public class LenientJacksonProvider implements ContextResolver<ObjectMapper> {

    private final ObjectMapper mapper = JsonMapper.builder()
            .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .build();

    @Override
    public ObjectMapper getContext(Class<?> type) {
        return mapper;
    }
}
```

In a real MicroProfile REST Client, make sure this provider is actually registered with the client, for example with `@RegisterProvider`, MicroProfile REST Client configuration, or your runtime's provider discovery mechanism.

The [`@JsonIgnoreProperties(ignoreUnknown = true)`][9] annotation is the one most people reach for first, because it is right next to the DTO and easy to read.

### How to call it

The HTTP call is identical – the difference is entirely server-payload vs. client-config. With strict Jackson and the six-field payload, the response is still valid JSON, but a Jackson-backed client trying to deserialize it into the three-field `Room` now fails:

```bash
curl -X GET http://localhost:8080/api/unknown-fields/room-7 \
  -H "Accept: application/json"
```

**✅ Pros:**
- Catches typos and contract drift early – a renamed field shows up as a loud failure, not silent data loss.
- Explicit: you opt in to every field you accept.

**❌ Cons:**
- An additive, backwards-compatible server change breaks your client. This is the one that surprises people.
- The fix lives in client code/config, which means you can't always fix it quickly if you don't own the client.

⚠️ _**Caution:** If you consume third-party APIs with raw Jackson defaults, you are one additive change away from an incident. Either set `@JsonIgnoreProperties(ignoreUnknown = true)` on your DTOs, or disable `FAIL_ON_UNKNOWN_PROPERTIES` globally – and do it deliberately, not by accident._

---

## 3. Quarkus: Jackson, but lenient

### What it looks like

Here is where it gets interesting, and where a lot of confusion comes from. Quarkus uses Jackson for a great deal of its JSON handling – but it does **not** keep Jackson's strict default.

Quarkus ships with `quarkus.jackson.fail-on-unknown-properties=false` as its **default**, which means a Quarkus app with Jackson **ignores unknown properties out of the box** – the opposite of what you'd get from a bare `ObjectMapper`. This is documented in the [Quarkus Jackson configuration reference][10] and the [Quarkus JSON guide][11].

So the same Jackson library behaves differently depending on whether Quarkus configured it for you or you `new`-ed up an `ObjectMapper` yourself. If you want the strict behaviour back, you flip the property:

```properties
# application.properties - opt back in to strict deserialization
quarkus.jackson.fail-on-unknown-properties=true
```

…or override it for a single class with the same `@JsonIgnoreProperties` annotation from §2.

### How to call it

```text
GET http://localhost:8080/api/unknown-fields/room-7
Accept: application/json
```

On Quarkus defaults, this succeeds even with the six-field payload, because Quarkus pre-configured Jackson to be lenient.

**✅ Pros:**
- Sensible "tolerant reader" default for a consumer, even though the underlying library is Jackson.
- One property toggles the behaviour for the whole app.

**❌ Cons:**
- It diverges from "stock Jackson", which trips up anyone who knows Jackson's default and assumes it applies here.
- Behaviour now depends on _where_ the `ObjectMapper` comes from (Quarkus-managed vs. hand-rolled).

🧪 _**Observation:** This is a perfect example of why "we use Jackson" is not enough information. The framework around Jackson decides the default, and Quarkus and a plain `ObjectMapper` land on opposite answers._

---

## 4. Spring Boot: also lenient

### What it looks like

Spring Boot ends up in the same place as Quarkus: it uses Jackson, but configures it to be lenient by default. Stock Jackson is strict, but in the current [Spring Boot 4.1 reference documentation][13], `spring.jackson.deserialization.fail-on-unknown-properties=false` is the documented default, so Spring also **ignores** unknown fields out of the box.

```properties
# application.properties - flip Spring back to strict if you want it
spring.jackson.deserialization.fail-on-unknown-properties=true
```

So if you're coming from Spring, the surprise is similar to Quarkus: you are using Jackson, but not stock Jackson defaults.

---

## A note on the other direction (server receiving extra fields)

So far we've looked at the _client_ receiving more than it expected. The mirror image is your _server_ receiving a request body with extra fields – a client POSTs more than your endpoint's DTO declares. The good news is that it is the **same providers and the same switches**:

- On **JSON-B / Yasson**, the extra fields in the inbound body are ignored by default.
- On **raw Jackson**, the inbound body fails with `UnrecognizedPropertyException` unless you set `@JsonIgnoreProperties(ignoreUnknown = true)` or disable `FAIL_ON_UNKNOWN_PROPERTIES`.
- On **Quarkus** and **Spring Boot**, the extra fields are ignored by default, for the same reasons as above.

There is one extra wrinkle worth flagging on the server side: silently ignoring unknown fields on _input_ can be a mild security/robustness smell. A client sending fields you don't recognise might be confused, might be on the wrong API version, or might be probing. Strictness on input is sometimes a feature, not a bug. This is the opposite of what is expected for a consumer.

> 💡 _**Note:** The mental model is "tolerant on the way in is convenient, strict on the way in is defensive". You get to choose per endpoint – just choose on purpose._

---

## Summary Comparison

The table below assumes the six-field JSON payload from the introduction being mapped onto the three-field `Room` DTO.

| Provider / stack            | Default on unknown fields | Result with extra fields            | How to flip it                                                      |
|-----------------------------| ------------------------- | ----------------------------------- | ------------------------------------------------------------------ |
| **JSON-B / Yasson**         | Ignore                    | ✅ Deserializes, extra fields dropped | (Already lenient; strictness needs custom validation/deserialization logic) |
| **Jackson (stock)**         | **Fail**                  | ❌ `UnrecognizedPropertyException`    | `@JsonIgnoreProperties(ignoreUnknown=true)` or disable the feature |
| **Quarkus + Jackson**       | Ignore                    | ✅ Deserializes, extra fields dropped | `quarkus.jackson.fail-on-unknown-properties=true`                  |
| **Spring Boot + Jackson**   | Ignore                    | ✅ Deserializes, extra fields dropped | `spring.jackson.deserialization.fail-on-unknown-properties=true`   |
{:.bordered-table}

The one row that catches people out is **Jackson (stock)** – and by extension any MicroProfile REST Client where you added a bare Jackson provider without configuring it.

## Conclusion

The MicroProfile REST Client doesn't have an opinion on unknown fields – it hands that decision to your JSON provider, and the providers don't agree:

- **JSON-B / Yasson** ignores them, by spec.
- **Stock Jackson** fails, by its own default.
- **Quarkus and Spring Boot** both use Jackson but pre-configure it to ignore them.

So the practical advice is short. If you're writing a consumer, you almost certainly want the tolerant-reader behaviour, so additive changes on the server don't page you at 2am. On JSON-B you already have it. On raw Jackson, add `@JsonIgnoreProperties(ignoreUnknown = true)` to your DTOs (or disable `FAIL_ON_UNKNOWN_PROPERTIES` once, globally) and be explicit that you've made that choice. And whatever you do, know which default you're actually running – because "we use Jackson" tells you almost nothing until you also know what configured it.

## What's Next?

Unknown fields are one small corner of building REST clients and APIs that survive change. The same [API Guide for Java][3] repo covers OpenAPI documentation, error handling, security, pagination, and versioning – see my earlier posts on [API versioning in Java using JAX-RS][14] and [RFC 9457 Problem Details][12]. The next post in this little run looks at the opposite of returning a `byte[]`: building an endpoint that _accepts_ binary attachments as part of the payload.

**_Happy (and tolerant) reading, folks!_**

---
[1]: https://download.eclipse.org/microprofile/microprofile-rest-client-3.0/microprofile-rest-client-spec-3.0.html
[2]: https://en.wikipedia.org/wiki/Robustness_principle
[3]: https://github.com/mehmandarov/api-guide-java
[4]: https://github.com/mehmandarov/api-guide-java/blob/main/src/main/java/com/mehmandarov/confapi/unknownfields/UnknownFieldsResource.java
[5]: https://github.com/mehmandarov/api-guide-java/blob/main/src/test/java/com/mehmandarov/confapi/unit/Ch7_UnknownFieldsTest.java
[6]: https://eclipse-ee4j.github.io/yasson/
[7]: https://jakarta.ee/specifications/jsonb/3.0/jakarta-jsonb-spec-3.0.html
[8]: https://fasterxml.github.io/jackson-databind/javadoc/2.18/com/fasterxml/jackson/databind/DeserializationFeature.html#FAIL_ON_UNKNOWN_PROPERTIES
[9]: https://fasterxml.github.io/jackson-annotations/javadoc/2.18/com/fasterxml/jackson/annotation/JsonIgnoreProperties.html
[10]: https://quarkus.io/guides/all-config#quarkus-jackson_quarkus-jackson-fail-on-unknown-properties
[11]: https://quarkus.io/guides/rest-json
[12]: {% post_url 2026-05-25-rfc-9457-problem-details-jakarta-ee %}
[13]: https://docs.spring.io/spring-boot/4.1.0/reference/features/json.html
[14]: {% post_url 2026-04-19-api-versioning %}
[15]: https://www.rfc-editor.org/rfc/rfc793#section-2.10
[16]: https://www.rfc-editor.org/rfc/rfc9413

