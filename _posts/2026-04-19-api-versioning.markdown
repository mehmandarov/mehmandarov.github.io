---
title: "API versioning in Java using JAX-RS with Jakarta EE and MicroProfile"
layout: post
date: 2026-04-19 09:50
description: Exploring common API versioning strategies in Java using JAX-RS with Jakarta EE and MicroProfile – URL, header, and media type versioning – with pros, cons, and practical code examples.
image: '/assets/images/posts-images/container-ship.jpeg'
tag:
    - english
    - java
    - architecture
    - api
    - jakarta ee
    - microprofile
    - jax-rs
    - openapi
category: blog
star: false
author: rustam.mehmandarov
---

_Creating APIs and maintaining them over time means often that we need to version them. We will be looking into several ways of doing so in Java using JAX-RS, while building our API end-points using Jakarta EE and MicroProfile. This post was inspired by my talk "API = Some REST and HTTP, right? RIGHT?!"_

- [Introduction](#introduction)
- [Why Versioning?](#why-versioning)
- [Show Me The CODE!](#show-me-the-code)
- [1. URL Versioning](#1-url-versioning)
- [2. Header Versioning](#2-header-versioning)
- [3. Media Type Versioning](#3-media-type-versioning-content-negotiation)
- [4. Request Parameter Versioning](#4-request-parameter-versioning)
- [5. Bonus: Combining Strategies](#5-bonus-combining-strategies---transparent-uri-rewriting-enterprise-pattern)
- [6. End-Point Deprecation](#6-end-point-deprecation)
- [Summary Comparison](#summary-comparison)
- [Conclusion](#conclusion)
- [What's Next?](#whats-next)

---

## Introduction

When working with APIs over time we would often need to make some changes to end-point definitions – like adding or deleting resources or changing the attributes for a resource. To ensure backwards compatibility, we often have to introduce _versioning_ for our APIs. APIs, like all software, evolve. You might be adding optional fields or introducing a breaking change. At some point, you will need versioning to support coexistence of the old and new consumers.

However, versioning the API endpoint introduces a question of how this should be done. In this post, we’ll explore **several common API versioning strategies**, using Jakarta EE and Java.

> 💡 Note: There is no silver bullet – instead, we’ll explore **pros, cons, and real-world fit**.

## Why Versioning?

Why not just change the API?  
Because breaking contracts is dangerous — clients may not update in sync, and you’ll break production consumers.

Versioning allows you to:
- Support legacy clients
- Introduce new features safely
- Deprecate responsibly

> ⚠️ **Caution**: Versioning can cause “version explosion.” Each version increases long-term maintenance cost – aka _technical debt_.

**Best Practice**: Prefer _backward-compatible changes_ (e.g., adding fields) whenever possible. To mitigate risks, it's important to follow best practices for versioning and provide clear documentation and migration paths for users. Also, remember to _deprecate_ old versions to minimize maintenance efforts.


## Show me the CODE!

I have created a repository called [Random Strings][2] to showcase various concepts. For this blogpost, I would recommend having a look at [`RandomStringsAPIDemoController.java`][3] and [`request_examples.http`][4]. You will find all the info on building and running the code in the repo's `README.md` file. Each section below will contain "How to call it" part with an example using `curl` or HTTP-files, and will be based on this repo.

---

## 1. URL Versioning

### What it looks like
A version appears directly in the URI path. If your API is at `https://example.com/api`, and the current version is version 1, the URL for a resource might look like this: `https://example.com/api/v1/resource`:

```java
@GET
@Path("/v2/")
@Produces(MediaType.APPLICATION_JSON)
public Response getV2() {
    return Response.status(Response.Status.NOT_IMPLEMENTED)
        .entity("This v2 using *path versioning* of the API is not implemented.")
        .build();
}
```

### How to call it

**cURL:**
```bash
curl -X GET http://localhost:8080/api/rnd/v2/ \
  -H "Accept: application/json"
```

**HTTP Request (`.http` file):**
```http
GET http://localhost:8080/api/rnd/v2/
Accept: application/json
```

**✅ Pros:**
- Simple and intuitive. Visible.
- Easy to test (e.g., with curl or Postman directly in a browser).
- Plays well with gateways and reverse proxies.
- Clear visual distinction between versions.

**❌ Cons:**
- Pollutes the URI with versioning logic.
- Breaks REST’s principle of stable resource identifiers.
- Clients have to update URLs when migrating.
- Risk of accumulating too many legacy versions.
- Can result in cluttered and difficult-to-read URLs if there are multiple versions of the API.

**🔍 However:** Despite its REST purism flaw, URL versioning is extremely practical and widely adopted.

## 2. Header Versioning

### What it looks like
Client specifies version in a custom HTTP header (e.g., `Accept-Version`, `X-API-Version`, etc.):

```java
@Path("/hi2")
@GET
@Produces({"application/json"})
public String entryPoint2(@HeaderParam("Accept-Version") String apiVersion) {
    if (apiVersion == null || apiVersion.isEmpty()) {
        return "Default unversioned endpoint hit.";
    }
    String message = "Versioned: Using custom headers. Using version: " + apiVersion +".";
    return message;
}
```

### How to call it

*Note: This is for demo purposes only. It has to have a different URL than the regular API; otherwise, it will also intercept calls that do not contain the `Accept-Version` header.*

**cURL:**
```bash
curl -X GET http://localhost:8080/api/rnd/versioned/ \
  -H "Accept: application/json" \
  -H "Accept-Version: 2"
```

**HTTP Request (`.http` file):**
```http
GET http://localhost:8080/api/rnd/versioned/
Accept: application/json
Accept-Version: 2
```

**✅ Pros:**
- Keeps URL structure clean and predictable.
- Closer to HTTP semantics (headers = metadata).
- Allows centralized versioning logic in filters/interceptors.

**❌ Cons:**
- Not self-descriptive — clients must “know the secret handshake”.
- Poor discoverability (not visible in browser without tools).
- Breaks caching in some proxies/CDNs unless explicitly configured.
- Adds complexity to tooling and testing.

**⚠️ Challenge:** Header versioning can feel “invisible” and cause developer confusion if not well-documented.

## 3. Media Type Versioning (Content Negotiation)

### What it looks like
Client specifies version via a custom media type in the `Accept` header. This is sometimes called [Content Negotiation][1] versioning.

```bash
Accept: application/hi.v3+json
```

In Jakarta EE:

```java
@Path("/hi")
@GET
@Produces({"application/hi.v3+json", "application/hi.v4+json"})
public String entryPoint() throws URISyntaxException {
    String message = "Versioned: Hai there!";
    return message;
}
```

### How to call it

You can request different versions (e.g., v3, v4, v5) by updating the media type:

**cURL:**
```bash
curl -X GET http://localhost:8080/api/rnd/ \
  -H "Accept: application/rnd.v3+json"
```

**HTTP Request (`.http` file):**
```http
GET http://localhost:8080/api/rnd/
Accept: application/rnd.v3+json
```

**✅ Pros:**
- Very REST-compliant: changes representation, not resource.
- URI remains stable.
- Supports richer format negotiation (e.g., XML, HAL, etc.).

**❌ Cons:**
- Requires strict control over media types.
- Not all clients/tooling handle custom media types well.
- Breaks with some reverse proxies and middleware that don’t forward full Accept headers.
- More work to configure content negotiation.

**🧪 Observation:** Elegant in design, but rarely used consistently in real-world public APIs.

## 4. Request Parameter Versioning

### What it looks like
_Technically_, it is also possible for the client to specify the version in a URL query parameter (e.g., `?version=2`). This, however, might not be a suggested strategy, in my opinion.

```bash
https://example.com/api/resource?version=2
```

### How to call it

**cURL:**
```bash
curl -X GET http://localhost:8080/api/rnd?version=2 \
  -H "Accept: application/json"
```

**HTTP Request (`.http` file):**
```http
GET http://localhost:8080/api/rnd?version=2
Accept: application/json
```

**✅ Pros:**
- Simplicity & discoverability: Easy to test in a browser without specialized tools.
- Defaulting logic: Straightforward to implement "default to latest" if the parameter is omitted.
- Caching friendly: CDNs treat different query params as unique resources by default.

**❌ Cons:**
- URI Pollution: Mixes resource identification with technical metadata.
- Routing complexity: Routing based on query parameters usually requires custom middleware or manual logic inside the controller.
- Harder to generate clean, automated documentation (like OpenAPI) when multiple versions share the same path.


## 5. Bonus: Combining Strategies - Transparent URI Rewriting (Enterprise Pattern)

In large enterprises, you might find that different clients have different needs. Some prefer the explicitness of URL versioning, while others require the clean URIs of Header versioning. You don't have to choose just one—you can support both without duplicating your backend routing logic.

The common practice is to structure all your resource classes using **URL versioning** (e.g., `@Path("/v1/resource")`), but use a **`@PreMatching` Filter** to intercept requests and transparently rewrite the URI if a client uses a header instead.

Here is what that looks like in Jakarta EE using a `ContainerRequestFilter`:

```java
@Provider
@PreMatching
public class HeaderVersionFilter implements ContainerRequestFilter {

      @Override
      public void filter(ContainerRequestContext ctx) {
          String path = ctx.getUriInfo().getPath();

          // If the path is already versioned (e.g., starts with v1, v2), let it pass
          if (path.matches("v\\d+(/.*)?")) return;

          // Otherwise, check if the client provided a version header
          String version = ctx.getHeaderString("X-API-Version");

          if (version != null && !version.isEmpty()) {
              // Transparently rewrite the URI internally to match our URL-based routes
              String newPath = "v" + version + "/" + path;
              URI baseUri = ctx.getUriInfo().getBaseUri();
              URI newUri = UriBuilder.fromUri(baseUri).path(newPath).build();

              ctx.setRequestUri(baseUri, newUri);
          }
      }
}
```

**✅ Pros:**
- **Ultimate Flexibility:** Clients can use `http://api.example.com/v2/resource` OR `http://api.example.com/resource` with an `X-API-Version: 2` header.
- **Single Source of Truth:** Your backend controllers only need to use `@Path("/v2/")`. You don't have to write duplicate methods to handle both headers and paths.

**❌ Cons:**
- **Magic Routing:** It introduces a layer of "magic" where the requested URI differs from the routed URI, which can briefly confuse new developers debugging the application.

**💡 Want to know more?** Read up on terms _`Version Normalization`_ and _`Internal Decoupling`_.


## 6. End-Point Deprecation

Eventually, you will need to retire old API versions. Remember: every old version you keep around is _technical debt_ — it increases long-term maintenance cost. When deprecating an endpoint, consider the following best practices:

1. **Update the Docs:** Use OpenAPI's `@Operation` annotation to clearly mark it as deprecated.
2. **Add `@Deprecated`:** Use the Java `@Deprecated` annotation where necessary.
3. **HTTP Redirects:** Consider returning HTTP codes like `302 Found` or `301 Moved Permanently` after some time.
4. **Add a Link header:** Provide a link to the new version in the response headers.
5. **Log / Count calls:** Track usage (e.g., with MicroProfile `@Counted`) to know when it is safe to finally remove the endpoint.

Here is a practical example in Jakarta EE showing how to deprecate an endpoint, add a `Link` header, and track metrics:

```java
@GET
@Path("v0.1/")
@Produces(MediaType.APPLICATION_JSON)
@Operation(summary = "DEPRECATED. Use v2 now. Returns the adjective-noun pair",
           description = "Deprecated function. The pair of one random adjective and one random noun is returned as an array.")
@Counted(name = "totalCountToRandomPairCalls_Versioned_Path_DEPRECATED",
         absolute = true,
         description = "Deprecated function call: Total number of calls to random string pairs.",
         tags = {"calls=pairs"})
@Deprecated
public Response getRndStringPathDeprecated() {
    URI newVersionURI = UriBuilder.fromUri("/api/rnd/v2/").build();
    Link newVersionLink = Link.fromUri(newVersionURI).rel("alternate").build();
    return Response.ok("Deprecated response", MediaType.APPLICATION_JSON)
            .header(jakarta.ws.rs.core.HttpHeaders.LINK, newVersionLink.toString())
            .header("X-API-Version", "0.1")
            .build();
}
```

### How to call it (Deprecated endpoint)

**cURL:**
```bash
curl -X GET http://localhost:8080/api/rnd/v0.1/ \
  -H "Accept: application/json"
```

**HTTP Request (`.http` file):**
```http
GET http://localhost:8080/api/rnd/v0.1/
Accept: application/json
```


## Summary Comparison

The following table summarizes all the different routing strategies implemented in the [demo project][2], illustrating how the HTTP method, path, and headers combine to invoke the correct Java method. The method names refer to the methods in [`RandomStringsAPIDemoController.java`][3] (or `RandomStringsController.java`):

| HTTP Method | Path             | Headers                           | Method Invoked                | Notes                                             |
| ----------- | ---------------- | --------------------------------- | ----------------------------- | ------------------------------------------------- |
| `GET`       | `/rnd`           | *None*                            | `getRndString()`              | Default (unversioned) endpoint                    |
| `GET`       | `/rnd`           | `Accept: application/json`        | `getRndString()`              | Standard media type                               |
| `GET`       | `/rnd/v2/`       | *Any*                             | `getRndStringV2path()`        | Demo for **path-based** versioning                |
| `GET`       | `/rnd/versioned` | *None*                            | `getRndStringV2Header()`      | Fallback to `getRndString()` if header is missing |
| `GET`       | `/rnd/versioned` | `Accept-Version: 2`               | `getRndStringV2Header()`      | **Header-based** versioning                       |
| `GET`       | `/rnd`           | `Accept: application/rnd.v3+json` | `getRndStringV3V4MediaType()` | **Media type versioning** — v3                    |
| `GET`       | `/rnd`           | `Accept: application/rnd.v4+json` | `getRndStringV3V4MediaType()` | **Media type versioning** — v4                    |
| `GET`       | `/rnd`           | `Accept: application/rnd.v5+json` | `getRndStringV5MediaType()`   | **Media type versioning** — v5                    |

## Conclusion

There is no single correct approach to API versioning. For most teams and public APIs, **URL versioning** is good enough—it’s visible, easy to test, and plays well with existing tooling. However, you might want to use **header versioning** if your APIs are primarily consumed by internal services or SDKs that can abstract away the complexity. Reserve **media type versioning** for hypermedia-rich or REST-purist APIs, and only if your tooling supports it end-to-end.

Consider who your consumers are, whether your API is public or internal, your infrastructure maturity, and your team’s ability to support multiple versions.


## What's Next?

Versioning is just one part of building robust REST APIs. If you want to dive deeper, have a look at the [API Guide for Java][5] repository and the slides in the [presentation folder][6]. They cover documentation with OpenAPI, security best practices (like RBAC and JWT integration), advanced patterns (pagination, async APIs), and going beyond REST with gRPC and GraphQL.

**_Happy coding!_**

---
[1]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation
[2]: https://github.com/mehmandarov/randomstrings/
[3]: https://github.com/mehmandarov/randomstrings/blob/master/src/main/java/com/mehmandarov/randomstrings/apidemo/RandomStringsAPIDemoController.java
[4]: https://github.com/mehmandarov/randomstrings/blob/master/request_examples.http
[5]: https://github.com/mehmandarov/api-guide-java
[6]: https://github.com/mehmandarov/api-guide-java/tree/main/presentation

