---
title: "Resumable file uploads with plain Jakarta EE and TUS protocol"
layout: post
date: 2026-07-15 07:00 +0200
description: Plain uploads break when connections drop. The TUS protocol fixes that with resumable uploads. Here we will implement it with pure Jakarta REST using POST, HEAD, PATCH, and a few headers.
image: '/assets/images/posts-images/floppies.jpg'
tag:
    - english
    - java
    - api
    - jakarta ee
    - jax-rs
    - file upload
    - tus
category: blog
star: false
author: rustam.mehmandarov
---

_In [my previous post][1] I covered binary uploads to REST endpoints – multipart, Quarkus `@RestForm`, and raw `application/octet-stream`. All three share one weakness: if the connection drops at 95%, you have to start over. This post adds resumability using the [TUS protocol][2], implemented with nothing but `jakarta.ws.rs`._

---

## Introduction

A plain HTTP upload is _all-or-nothing_. If anything interrupts the stream, the whole thing is gone. For a 2 MB profile picture that's a shrug and a retry. For a 4 GB video over a hotel network or a spotty mobile connection, every retry starts from byte zero. The flakier the connection, the less likely you are to ever reach the end.

[TUS][2] is an open protocol that fixes this. Instead of one big request, the upload becomes a series of small ones, and the server keeps track of how many bytes have arrived. When the connection dies, the client asks "how far did we get?" and continues from there. [Vimeo][8], [Cloudflare][13], and [Supabase][14] all use it for their upload APIs.

The core protocol is small enough to implement with plain Jakarta REST annotations and nothing else. Let's do that. But first, a few words on how TUS works.

## The TUS protocol in a nutshell

The whole flow is just three HTTP requests and a handful of headers:

1. **`POST /files`** – creates a new upload. The client declares the total size with an `Upload-Length` header; the server responds with `201 Created` and a `Location` header pointing at the new upload resource.
2. **`HEAD /files/{id}`** – asks where to resume. The server answers with an `Upload-Offset` header: the number of bytes it has safely received so far.
3. **`PATCH /files/{id}`** – appends bytes at that offset, with `Content-Type: application/offset+octet-stream`. The server responds with the new `Upload-Offset`.

That's it. Upload chunks with `PATCH` until the offset equals the length; if anything breaks, do a `HEAD` and continue from the offset it returns.

Oh, and one more rule: every request and response carries a `Tus-Resumable: 1.0.0` header, so both sides know which protocol version they're speaking.

Everything else is layered on top as optional [extensions][2]: cancelling an upload with `DELETE` (termination), checksums, expiration. Strictly speaking, even the `POST` above belongs to the `creation` extension – the core spec only covers resuming with `HEAD` and `PATCH` – but in practice every client and server implements it.

## Why not a library?

There is a server-side library – [tus-java-server][6] – and since version `1.0.0-3.0` it targets `jakarta.servlet`, so it drops into Jakarta EE 10+ runtimes without tricks. It's a fine choice if you want the full protocol with extensions. But it's servlet-based, not JAX-RS – you wire it into a servlet or a controller and hand it the raw request. Since the core protocol fits in three resource methods, and we would like to understand how it all works, implementing it natively in Jakarta REST is barely more work. That's what we'll do here.

## Implementing it with pure Jakarta REST

The implementation below uses nothing but `jakarta.ws.rs`, so it runs unchanged on either Helidon, Open Liberty, Payara, or Quarkus. As with the previous posts, the code lives in my [API Guide for Java][3] repository – see [`TusResource.java`][4] in the `upload/tus` package, with ready-made requests in [`http/tus.http`][5]. (In the repo the endpoints sit under the application's `/api` prefix, so it's `/api/tus` there.)

```java
@Path("/tus")
public class TusResource {

    private static final String TUS_VERSION = "1.0.0";
    private static final java.nio.file.Path STORAGE_DIR =
            java.nio.file.Path.of(System.getProperty("java.io.tmpdir"), "tus-uploads");

    // upload id -> declared total length
    private static final Map<String, Long> UPLOAD_LENGTHS = new ConcurrentHashMap<>();

    @Context
    UriInfo uriInfo;

    // Capability discovery – what the server supports
    @OPTIONS
    public Response options() {
        return Response.noContent()
                .header("Tus-Resumable", TUS_VERSION)
                .header("Tus-Version", TUS_VERSION)
                .header("Tus-Extension", "creation")
                .build();
    }

    // 1. Create the upload – returns the URL the client will PATCH to
    @POST
    public Response create(@HeaderParam("Upload-Length") Long uploadLength) throws IOException {
        if (uploadLength == null || uploadLength < 0) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .header("Tus-Resumable", TUS_VERSION)
                    .build();
        }

        String id = UUID.randomUUID().toString();
        Files.createDirectories(STORAGE_DIR);
        Files.createFile(STORAGE_DIR.resolve(id));
        UPLOAD_LENGTHS.put(id, uploadLength);

        URI location = uriInfo.getAbsolutePathBuilder().path(id).build();
        return Response.created(location)
                .header("Tus-Resumable", TUS_VERSION)
                .build();
    }

    // 2. Ask where to resume from
    @HEAD
    @Path("/{id}")
    public Response offset(@PathParam("id") String id) throws IOException {
        Long length = UPLOAD_LENGTHS.get(id);
        if (length == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .header("Tus-Resumable", TUS_VERSION)
                    .build();
        }

        long offset = Files.size(STORAGE_DIR.resolve(id));
        return Response.noContent()
                .header("Tus-Resumable", TUS_VERSION)
                .header("Upload-Offset", offset)
                .header("Upload-Length", length)
                .header("Cache-Control", "no-store")
                .build();
    }

    // 3. Append a chunk at the given offset
    @PATCH
    @Path("/{id}")
    @Consumes("application/offset+octet-stream")
    public Response append(@PathParam("id") String id,
                           @HeaderParam("Upload-Offset") Long uploadOffset,
                           InputStream body) throws IOException {
        Long length = UPLOAD_LENGTHS.get(id);
        if (length == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .header("Tus-Resumable", TUS_VERSION)
                    .build();
        }

        java.nio.file.Path file = STORAGE_DIR.resolve(id);
        long currentOffset = Files.size(file);

        // The client's idea of the offset must match ours – otherwise 409
        if (uploadOffset == null || uploadOffset != currentOffset) {
            return Response.status(Response.Status.CONFLICT)
                    .header("Tus-Resumable", TUS_VERSION)
                    .header("Upload-Offset", currentOffset)
                    .build();
        }

        long newOffset;
        try (OutputStream out = Files.newOutputStream(file, StandardOpenOption.APPEND)) {
            body.transferTo(out);
            newOffset = Files.size(file);
        }

        return Response.noContent()
                .header("Tus-Resumable", TUS_VERSION)
                .header("Upload-Offset", newOffset)
                .build();
    }
}
```

A few things worth pointing out:

- **`@PATCH` and `@HEAD` are standard `jakarta.ws.rs` annotations** – no vendor extras, which is what keeps this portable.
- **The body is a plain `InputStream`.** `transferTo` plus `StandardOpenOption.APPEND` do the heavy lifting: each chunk is streamed straight onto the end of the file, never buffered in memory.
- **The offset check is the heart of the protocol.** The file on disk is the single source of truth. If the client's `Upload-Offset` doesn't match `Files.size(file)`, the server answers `409 Conflict` with the correct offset, and the client retries from there. A half-received chunk is harmless: whatever made it to disk counts, the rest is re-sent.
- **`Tus-Resumable: 1.0.0` goes on _every_ response** – including the error ones.
- **The in-memory map is demo-only.** A restart wipes it, orphaning the files on disk. In production, persist the upload metadata – more on that below.

## Testing it with curl

For the sake of the experiment, let's split a 100 MB file into two 50 MB chunks and pretend the connection died in between:

```bash
# 1. Create a 100 MB upload
curl -si -X POST http://localhost:8080/tus \
     -H "Tus-Resumable: 1.0.0" \
     -H "Upload-Length: 104857600"
# -> 201 Created, Location: http://localhost:8080/tus/{id}

# 2. Upload the first chunk (and pretend the connection died after it)
curl -si -X PATCH http://localhost:8080/tus/{id} \
     -H "Tus-Resumable: 1.0.0" \
     -H "Upload-Offset: 0" \
     -H "Content-Type: application/offset+octet-stream" \
     --data-binary @chunk-1.bin
# -> 204 No Content, Upload-Offset: 52428800

# 3. Come back later – ask the server where we left off
curl -sI http://localhost:8080/tus/{id} \
     -H "Tus-Resumable: 1.0.0"
# -> Upload-Offset: 52428800

# 4. Resume from that offset
curl -si -X PATCH http://localhost:8080/tus/{id} \
     -H "Tus-Resumable: 1.0.0" \
     -H "Upload-Offset: 52428800" \
     -H "Content-Type: application/offset+octet-stream" \
     --data-binary @chunk-2.bin
# -> 204 No Content, Upload-Offset: 104857600 – done!
```

> **Note:** In real life you don't split files by hand. TUS clients – [tus-js-client][7] for the browser, [tus-java-client][9] for the JVM – handle chunking, retries, and the HEAD-on-reconnect automatically. The curl session above is just the protocol laid bare.
{:.note}

## A simple frontend

curl is fine for testing, but the whole point of TUS is surviving flaky _browser_ connections. So let's wire up [tus-js-client][7]. A single HTML file, no build step. Below is a simplified version – the full demo with styling and a few more niceties lives in the repo as [`snippets/tus-upload-demo.html`][12]:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Resumable upload demo</title>
    <script src="https://cdn.jsdelivr.net/npm/tus-js-client@4/dist/tus.min.js"></script>
</head>
<body>
    <input type="file" id="file">
    <button id="toggle" disabled>Pause</button>
    <progress id="progress" value="0" max="100"></progress>
    <span id="status"></span>

    <script>
        let upload = null;
        let paused = false;

        const progress = document.getElementById("progress");
        const status = document.getElementById("status");
        const toggle = document.getElementById("toggle");

        document.getElementById("file").addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            upload = new tus.Upload(file, {
                endpoint: "http://localhost:8080/tus",
                chunkSize: 5 * 1024 * 1024,               // 5 MB per PATCH
                retryDelays: [0, 1000, 3000, 5000],        // auto-retry on failure
                metadata: { filename: file.name, filetype: file.type },
                onProgress: (sent, total) => {
                    progress.value = (sent / total) * 100;
                    status.textContent = `${(sent / 1048576).toFixed(1)} / ${(total / 1048576).toFixed(1)} MB`;
                },
                onSuccess: () => { status.textContent = "Done: " + upload.url; },
                onError: (err) => { status.textContent = "Error: " + err; }
            });

            // Resume a previous attempt of the same file, if one exists
            upload.findPreviousUploads().then((previous) => {
                if (previous.length > 0) upload.resumeFromPreviousUpload(previous[0]);
                upload.start();
                toggle.disabled = false;
            });
        });

        toggle.addEventListener("click", () => {
            paused = !paused;
            paused ? upload.abort() : upload.start();   // abort() pauses, start() resumes
            toggle.textContent = paused ? "Resume" : "Pause";
        });
    </script>
</body>
</html>
```

Here is what the full demo from the repo looks like in the browser:

![Screenshot of the upload demo UI, showing a file being uploaded with a progress bar and a pause button][15]{: class="bigger-image screenshot" }
<figcaption class = "caption">The demo frontend mid-upload – progress bar, pause/resume, and the upload URL from the server.</figcaption>

A few things worth pointing out here:

- **`findPreviousUploads()` survives page reloads.** tus-js-client remembers upload URLs in `localStorage`, keyed by file fingerprint. Reload the page, pick the same file, and the upload resumes instead of restarting.
- **`abort()` / `start()` is pause/resume.** `start()` does a `HEAD` to get the current offset and `PATCH`es onward – the curl session from the previous section, automated.
- **The `metadata` option** sends an `Upload-Metadata` header (key/value pairs with base64-encoded values) on the `POST`. Our minimal server ignores it – parse it in `create()` if you want to keep the original filename.
- **Don't forget CORS.** If the page and the API live on different origins, the TUS headers must be explicitly allowed and exposed. The easiest portable way is a `ContainerResponseFilter`:

```java
@Provider
public class TusCorsFilter implements ContainerResponseFilter {

    @Override
    public void filter(ContainerRequestContext request, ContainerResponseContext response) {
        // Only for the TUS endpoints – don't leak CORS headers elsewhere
        if (!request.getUriInfo().getPath().startsWith("tus")) {
            return;
        }
        response.getHeaders().add("Access-Control-Allow-Origin", "*"); // narrow this in production
        response.getHeaders().add("Access-Control-Allow-Methods", "POST, HEAD, PATCH, OPTIONS");
        response.getHeaders().add("Access-Control-Allow-Headers",
                "Tus-Resumable, Upload-Length, Upload-Offset, Upload-Metadata, Content-Type");
        response.getHeaders().add("Access-Control-Expose-Headers",
                "Tus-Resumable, Upload-Offset, Location");
    }
}
```

Without the `Expose-Headers` part, the browser hides `Location` and `Upload-Offset` from JavaScript, and tus-js-client can't resume – a classic "works in curl, fails in the browser" moment.

## Production considerations

The resource above shows the protocol, not a production service. Before shipping something like it:

- **Persist the upload metadata.** The `ConcurrentHashMap` dies with the JVM. Store the declared length (and anything from `Upload-Metadata`) in a database or a sidecar file next to the partial upload, so uploads survive restarts.
- **Expire abandoned uploads.** Partial files accumulate. The [expiration extension][2] adds an `Upload-Expires` header; even without it, a scheduled job that deletes old partials is a must.
- **Verify integrity.** The checksum extension lets the client send an `Upload-Checksum` header per `PATCH`, and the server verify before appending.
- **Lock concurrent PATCHes.** Two simultaneous `PATCH` requests to the same upload will interleave appends and corrupt the file. The offset check catches most of it (the second request gets a 409), but a per-upload lock closes the race completely.
- **Cap the size.** Same refrain as in the [previous post][1]: an unbounded upload endpoint is a denial-of-service waiting to happen. Validate `Upload-Length` on `POST`, and don't accept more bytes than were declared on `PATCH`.

## Summary

**✅ Pros:**
- **Survives failure.** Connection drops, page reloads, and pause/resume all work – uploads continue instead of restarting.
- **Portable.** Pure `jakarta.ws.rs`; the same class runs on Helidon, Open Liberty, Payara, and Quarkus.
- **An open, proven protocol.** Mature clients exist for browser, JVM, iOS, and Android.

**❌ Cons:**
- **More moving parts than a plain POST.** Upload state, partial files, cleanup jobs, locking.
- **No JAX-RS library.** The existing Java server library is servlet-based; for a pure Jakarta REST setup you implement the core yourself (as here).
- **Overkill for small files.** A few megabytes on stable networks? A plain multipart POST from the [previous post][1] is good enough.

| Approach                                 | Resumable? | Complexity | Reach for it when…                                    |
|------------------------------------------|------------|------------|-------------------------------------------------------|
| **Plain upload** _([previous post][1])_  | ❌ No       | Low        | Small files, stable networks.                          |
| **TUS** _(this post)_                    | ✅ Yes      | Medium     | Large files, mobile/flaky networks, pause/resume UX.   |
{:.bordered-table}

## Conclusion

The TUS protocol is small: `POST` to create, `HEAD` to ask where you are, `PATCH` to continue, and one header on everything. The server side fits in three methods of plain Jakarta REST, with the file on disk as the single source of truth for progress. On the client side, tus-js-client adds chunking, retries, and resume-after-reload for free.

The trade-off: you take on upload state, cleanup, and locking in exchange for uploads that survive the real world. For large files on imperfect networks, that's a good deal.

## What's Next?

This post continues the upload thread from [binary file uploads to REST endpoints][1]. The same [API Guide for Java][3] repo also covers OpenAPI docs, error handling with [RFC 9457][10], security, pagination, and [API versioning][11]. Some of those topics I have blogged about already; others might make it into future posts here.

**_Happy upload resuming!_ ⏯️ 💾**

---
[1]: {% post_url 2026-06-08-rest-api-binary-attachments %}
[2]: https://tus.io/protocols/resumable-upload
[3]: https://github.com/mehmandarov/api-guide-java
[4]: https://github.com/mehmandarov/api-guide-java/blob/main/src/main/java/com/mehmandarov/confapi/upload/tus/TusResource.java
[5]: https://github.com/mehmandarov/api-guide-java/blob/main/http/tus.http
[6]: https://github.com/tomdesair/tus-java-server
[7]: https://github.com/tus/tus-js-client
[8]: https://developer.vimeo.com/api/upload/videos
[9]: https://github.com/tus/tus-java-client
[10]: {% post_url 2026-05-25-rfc-9457-problem-details-jakarta-ee %}
[11]: {% post_url 2026-04-19-api-versioning %}
[12]: https://github.com/mehmandarov/api-guide-java/blob/main/snippets/tus-upload-demo.html
[13]: https://developers.cloudflare.com/stream/uploading-videos/resumable-uploads/
[14]: https://supabase.com/docs/guides/storage/uploads/resumable-uploads
[15]: {{ '/assets/images/posts-images/2026-07-15-upload_frontend_demo.png' | relative_url }}
