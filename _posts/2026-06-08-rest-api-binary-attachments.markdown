---
title: "Binary file uploads to REST endpoints using Jakarta EE or Quarkus"
layout: post
date: 2026-07-08 14:00
description: How to build a REST API that accepts binary attachments? As part of a multipart payload, or as the whole body. Standard Jakarta REST 3.1 EntityPart, the Quarkus @RestForm approach, and the raw application/octet-stream case, with code examples and the usual pros and cons.
image: '/assets/images/posts-images/binarycode.jpg'
tag:
    - english
    - java
    - api
    - jakarta ee
    - microprofile
    - jax-rs
    - quarkus
    - file upload
category: blog
star: false
author: rustam.mehmandarov
---

_A while back I wrote about endpoints that [**send** back a `byte[]` – images and PDFs][1]. This post does the reverse: endpoints that **receive** binary data. We'll look at the three ways this usually happens – a file as one part of a multipart form, the same thing using the Quarkus way, and a single binary body with no multipart wrapper at all. As always, code, the official docs, and the trade-offs for each._

---

## Introduction

To return a file from a REST endpoint to a user (or a system) you need to set a MIME type, hand back a `byte[]`, and you're done. Uploading a binary to a server, on the other hand, is where things get a little more complex. Mostly because there is more than one way a client might want to send it.

Two situations come up again and again:

- **A file plus some metadata** – e.g. a profile picture together with a `userId`, or a document with a `title` and a `description`. This is the classic `multipart/form-data` request: several named parts, one (or more) of which happens to be binary.
- **Just the bytes** – the client `PUT`s a raw image or a PDF and nothing else. No form, no metadata, the body _is_ the file. This is a plain `application/octet-stream` (or a specific type like `image/png`) request.

We'll cover both. For the multipart case there are two routes worth knowing: the standard Jakarta REST 3.1 API that runs anywhere, and the Quarkus-specific one that is more "ergonomic", if you've already committed to Quarkus.

## A little bit of history

For years, multipart handling in JAX-RS was a gap in the standard. Everyone reached for a vendor extension – RESTEasy's `@MultipartForm`, Jersey's `FormDataMultiPart`, Apache CXF's attachments – and the code you wrote was tied to whichever runtime you happened to be on. Portable multipart code simply wasn't a thing.

That changed with **Jakarta REST 3.1**, which added the [`EntityPart` API][2] – a standard, vendor-neutral way to read (and build) the parts of a multipart message. If portability across Jakarta runtimes matters to you – in the same way as my [RFC 9457 error handling][3] and [Jakarta Expression Language][4] posts – the next section is for you.

> **Note:** If you've used `@MultipartForm` on older RESTEasy, `EntityPart` is the standardised successor to that idea.
{:.note}

I've added an `upload` package to my [API Guide for Java][5] repository. [`UploadResource.java`][6] holds the two portable endpoints (the standard `EntityPart` multipart one and the raw octet-stream one) – pure `jakarta.ws.rs`, so they compile and run on every runtime the repo targets. The Quarkus `@RestForm` variant lives as a reference snippet at [`QuarkusUploadResource.java`][7] (kept out of the main build because it only compiles on Quarkus). Ready-made requests are in [`http/uploads.http`][8]. Each section below shows how to run it with `curl`.

---

## 1. The standard way: Jakarta REST `EntityPart`

Here is an endpoint that accepts a multipart form with two parts: a `file` (the binary) and a `description` (plain text). It uses nothing but `jakarta.ws.rs`, so it runs on Helidon, Open Liberty, Payara, Jersey, and Quarkus alike.

```java
@Path("/uploads")
public class UploadResource {

    @POST
    @Path("/multipart")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response upload(List<EntityPart> parts) throws IOException {
        String description = null;
        String fileName = null;
        long bytesReceived = 0;

        for (EntityPart part : parts) {
            switch (part.getName()) {
                case "description" ->
                        description = part.getContent(String.class);
                case "file" -> {
                    fileName = part.getFileName().orElse("unnamed");
                    try (InputStream in = part.getContent()) {
                        bytesReceived = in.transferTo(OutputStream.nullOutputStream());
                        // in real code: stream to storage, scan, resize, etc.
                    }
                }
                default -> { /* ignore unknown parts */ }
            }
        }

        var summary = Map.of(
                "fileName", fileName == null ? "unnamed" : fileName,
                "bytes", bytesReceived,
                "description", description == null ? "" : description);
        return Response.ok(summary).build();
    }
}
```

A few things worth pointing out:

- The method parameter is a `List<EntityPart>`. The runtime parses the multipart body and hands you the parts; you decide what to do with each by its `getName()`.
- `part.getContent(String.class)` reads a text part as a `String`. For the binary part, `part.getContent()` gives you an `InputStream` – so you can stream straight to disk or object storage **without buffering the whole file in memory**. That last point matters once files get large.
- `part.getFileName()` returns an `Optional<String>` – the original filename from the `Content-Disposition` header, if the client sent one.

### How to call it

```bash
curl -X POST http://localhost:8080/api/uploads/multipart \
  -F "description=Conference floor plan" \
  -F "file=@floorplan.pdf;type=application/pdf"
```

Here is what that `curl` command actually puts on the wire – a `multipart/form-data` body where each `-F` flag becomes its own part, separated by a `boundary` string, each with its own headers and content (the binary PDF bytes replaced with a placeholder here):

```text
POST http://localhost:8080/api/uploads/multipart
Content-Type: multipart/form-data; boundary=----boundary

------boundary
Content-Disposition: form-data; name="description"

Conference floor plan
------boundary
Content-Disposition: form-data; name="file"; filename="floorplan.pdf"
Content-Type: application/pdf

[binary content of floorplan.pdf]
------boundary--
```

This is exactly the structure the `List<EntityPart>` parameter receives on the server side – one `EntityPart` per boundary-delimited section, with `getName()` returning `description` and `file` respectively.

> **Note:** The `boundary` string is chosen by the *client*, and can be almost anything – [RFC 2046][13] allows up to 70 characters from a restricted set, with one hard rule: it must never appear inside the parts it separates. That's why `curl` generates a long random one (something like `------------------------d74496d66958873e`) for every request. The `----boundary` used here is just a simplified placeholder to keep the examples readable.
{:.note}

**✅ Pros:**
- **Portable.** Pure `jakarta.ws.rs`; the same code runs on every Jakarta REST 3.1+ runtime.
- **Streams by default.** `getContent()` as `InputStream` means no need to hold the whole upload in memory.
- **Metadata and file in one request.** Text parts and binary parts sit side by side.

**❌ Cons:**
- A bit more ceremony – you loop over parts and dispatch on names yourself.
- Requires Jakarta REST 3.1+ (Jakarta EE 10 and later). Older runtimes don't have `EntityPart`. (Which is not really a con.)

> **However:** The extra few lines buy you portability. If "runs on every Jakarta runtime" is on your list, this is the price, and it's a small one.
{:.note}

---

## 2. The Quarkus way: `@RestForm` and `FileUpload`

If you're on Quarkus, RESTEasy Reactive gives you a more declarative style. You bind each part directly to a parameter with [`@RestForm`][9], and binary parts map to a [`FileUpload`][10] (or a `java.nio.file.Path`, or a `java.io.File`):

```java
@Path("/uploads")
public class QuarkusUploadResource {

    @POST
    @Path("/quarkus")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, Object> upload(
            @RestForm("description") String description,
            @RestForm("file") FileUpload file) {

        // Note: The upload is already on disk as a temp file. We only return
        // metadata here, but file.uploadedFile() gives you its Path when
        // you need the content, e.g.:
        // Files.move(file.uploadedFile(), Path.of("/storage", file.fileName()));
        return Map.of(
                "fileName", file.fileName() == null ? "unnamed" : file.fileName(),
                "size", file.size(),
                "contentType", file.contentType() == null ? "application/octet-stream" : file.contentType(),
                "description", description == null ? "" : description);
    }
}
```

This is noticeably tidier than the `EntityPart` loop – the framework does the dispatching for you, and `FileUpload` exposes `fileName()`, `size()`, `contentType()`, and a `uploadedFile()` `Path` pointing at a temp file Quarkus has already streamed to disk. Move or copy that file if you want to keep it – the temp file is cleaned up when the request ends. The Quarkus [REST guide][11] covers this and the multipart options in detail.

If you prefer a single object over several parameters, Quarkus also supports a class annotated with the parts as fields and bound with `@BeanParam` – handy when there are many fields.

### How to call it

_Note: in the [demo repo][5] this endpoint lives as a snippet and runs only when you build with the Quarkus profile and move it onto the classpath – the portable `EntityPart` endpoints above are the ones that work out of the box on every runtime._

```bash
curl -X POST http://localhost:8080/api/uploads/quarkus \
  -F "description=Speaker headshot" \
  -F "file=@headshot.png;type=image/png"
```

The request on the wire has the same multipart shape as in the `EntityPart` section – the only thing that changes is how the server side consumes it:

```text
POST http://localhost:8080/api/uploads/quarkus
Content-Type: multipart/form-data; boundary=----boundary

------boundary
Content-Disposition: form-data; name="description"

Speaker headshot
------boundary
Content-Disposition: form-data; name="file"; filename="headshot.png"
Content-Type: image/png

[binary content of headshot.png]
------boundary--
```

**✅ Pros:**
- **Less boilerplate.** Each part is just a parameter; no manual loop.
- **Files land on disk for you.** `FileUpload.uploadedFile()` is a ready-to-use temp `Path`.
- Plays nicely with the rest of the Quarkus stack (validation, etc.).

**❌ Cons:**
- **Quarkus-specific.** `@RestForm` and `FileUpload` are not portable – move to Helidon or Open Liberty and this code doesn't come with you.
- Temp-file handling has its own knobs (location, max size) you may need to tune.

> **Observation:** This is the same trade-off as everywhere in this series – the vendor API is more pleasant, the standard API is more portable. Pick based on whether you ever expect to change runtimes.
{:.note}

---

## 3. Payload only: A single binary body

Sometimes there's no form and no metadata – the client just sends the file as the entire request body. No multipart, no boundaries, the body _is_ the bytes. This is the right shape for "upload this one image" style endpoints, and it's the simplest of the three.

You consume `application/octet-stream` (or a concrete type) and take the body as an `InputStream` so you can stream it:

```java
@POST
@Path("/raw")
@Consumes(MediaType.APPLICATION_OCTET_STREAM)
@Produces(MediaType.APPLICATION_JSON)
public Response uploadRaw(
        InputStream body,
        @HeaderParam("Content-Type") String contentType,
        @HeaderParam("X-File-Name") String fileName) throws IOException {

    long bytes = body.transferTo(OutputStream.nullOutputStream());
    // in real code: stream to storage instead of counting

    var summary = Map.of(
            "fileName", fileName == null ? "unnamed" : fileName,
            "contentType", contentType == null ? "application/octet-stream" : contentType,
            "bytes", bytes);
    return Response.ok(summary).build();
}
```

Since there's no `Content-Disposition` part to carry the filename, the usual trick is to pass that kind of metadata in headers (`X-File-Name` above) or in the URL. The body parameter as `InputStream` keeps it streaming; you could also declare it as `byte[]` if the payload is genuinely small and you're fine buffering it.

This part is pure `jakarta.ws.rs` too, so it's portable across runtimes.

### How to call it

```bash
curl -X POST http://localhost:8080/api/uploads/raw \
  -H "Content-Type: image/png" \
  -H "X-File-Name: headshot.png" \
  --data-binary "@headshot.png"
```

And on the wire – notice how much simpler it is than multipart: no boundaries, no parts, just headers followed by the raw bytes as the entire body:

```text
POST http://localhost:8080/api/uploads/raw
Content-Type: image/png
X-File-Name: headshot.png

[binary content of headshot.png]
```

**✅ Pros:**
- **Dead simple.** The body is the file; nothing to parse.
- **Portable** and streams naturally.
- A good fit for machine-to-machine "here is one blob" calls.

**❌ Cons:**
- **No room for metadata** in the body – you push it into headers or the URL, which is less tidy.
- Only one file per request. Need several files or several fields? You want multipart from §1 or §2.

> **Caution:** Use `--data-binary`, not `-d`/`--data`, when testing with curl. `-d` strips newlines and null bytes from file input and will quietly corrupt binary payloads – it's caught more than one person out.
{:.warning}

---

## A word on limits, safety, and security

Accepting uploads means accepting input from someone you don't control, so a few guardrails are worth having regardless of which approach you pick:

- **Cap the size.** An unbounded upload endpoint is a denial-of-service waiting to happen. Most runtimes let you set a maximum body / multipart size (on Quarkus, e.g. `quarkus.http.limits.max-body-size` and the multipart limits). Set it.
- **Don't trust the `Content-Type` or the filename.** Both come from the client. If the file type matters, sniff the actual content rather than believing the header, and never use a client-supplied filename directly as a path on disk.
- **Stream, don't buffer.** Prefer `InputStream` / a temp `Path` over `byte[]` for anything that could be large, so one big upload doesn't blow up your heap.
- **Scan if it matters.** If the files end up somewhere others can fetch them, virus/content scanning belongs in the pipeline.

> **Note:** "Validate your input" is the same refrain as in the [Jakarta EL post][4] – binary input is still input. The bytes are opaque, but the size, the type, and the filename are all attacker-controllable.
{:.warning}
 
---

## Summary Comparison

| Approach                      | Payload shape                    | Portability                                    | Metadata + file together? | Reach for it when…                                  |
|-------------------------------| -------------------------------- | ---------------------------------------------- | ------------------------- | --------------------------------------------------- |
| **`EntityPart`** _(§1)_       | `multipart/form-data`            | &nbsp;✅ Any Jakarta REST 3.1+ runtime               | ✅ Yes                     | You want portable multipart handling.               |
| **Quarkus `@RestForm`** _(§2)_| `multipart/form-data`            | &nbsp;✅ Quarkus only                                | ✅ Yes                     | You're on Quarkus and want the tidiest code.        |
| **Raw body** _(§3)_           | `application/octet-stream` etc.  | &nbsp;✅ Any Jakarta REST runtime                    | ❌ Headers/URL only        | One file, no metadata, machine-to-machine.          |
{:.bordered-table}

## Conclusion

Receiving binary isn't hard once you know which of the three shapes you're dealing with:

- If a client sends a **file plus fields**, that's multipart. 
  – Use **`EntityPart`** for portable code, or **Quarkus `@RestForm`** for the more ergonomic, Quarkus-only version.
- If a client sends **just the bytes**, that's a raw body. 
  – Use **`@Consumes(APPLICATION_OCTET_STREAM)`** with an `InputStream`, and metadata goes in headers.

The recurring theme, same as for many other posts lately, is the standard-vs-vendor trade-off: `EntityPart` runs everywhere, `@RestForm` is nicer to write but ties you to Quarkus. And whichever you choose, treat the upload as untrusted input – cap the size, distrust the headers, and stream rather than buffer.

## What's Next?

This closes the loop with my old [MicroProfile Part 1][1] post: that one _returned_ images and PDFs, this one _receives_ them. The same [API Guide for Java][5] repo also covers OpenAPI docs, error handling with [RFC 9457][3], security, pagination, and [API versioning][12]. Some of those topics I have blogged about already; others might make it into future posts here.

**_Happy file uploading!_ 💾**

---
[1]: {% post_url 2019-07-01-microprofile-101-part1 %}
[2]: https://jakarta.ee/specifications/restful-ws/3.1/apidocs/jakarta.ws.rs/jakarta/ws/rs/core/entitypart
[3]: {% post_url 2026-05-25-rfc-9457-problem-details-jakarta-ee %}
[4]: {% post_url 2026-06-17-jakarta-el-safer-rules-without-handwritten-predicate-parsers %}
[5]: https://github.com/mehmandarov/api-guide-java
[6]: https://github.com/mehmandarov/api-guide-java/blob/main/src/main/java/com/mehmandarov/confapi/upload/UploadResource.java
[7]: https://github.com/mehmandarov/api-guide-java/blob/main/snippets/QuarkusUploadResource.java
[8]: https://github.com/mehmandarov/api-guide-java/blob/main/http/uploads.http
[9]: https://quarkus.io/guides/rest#multipart
[10]: https://quarkus.io/guides/rest#file-uploads
[11]: https://quarkus.io/guides/rest
[12]: {% post_url 2026-04-19-api-versioning %}
[13]: https://www.rfc-editor.org/rfc/rfc2046#section-5.1.1

