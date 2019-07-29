---
title: "MicroProfile – Part 1: Defining End-Points"
layout: post
date: 2019-07-28 07:25
image: '/assets/images/posts-images/lego-record-shop.jpg'
description:
tag:
- java
- microservices
- microprofile
- english
category: blog
star: false
author: rustam.mehmandarov
---

_Part 1: End-points in MicroProfile. This is a part of a series of posts to help you getting started with microservices in MicroProfile and showing off some of the features it brings to the table._

- [Intro](#intro)
- [Getting started](#getting-started)
- [Defining End-Points](#defining-end-points)
	- [A (Regular) JSON End-Point](#a-regular-json-end-point)
	- [An End-Point Returning an Image](#an-end-point-returning-an-image)
	- [An End-Point Returning a PDF](#an-end-point-returning-a-pdf)
- [What's Next?](#whats-next)

---

## Intro

In my previous two posts, I have been describing parts of a system for "checking-in" to a location using QR codes in Java. We started with [generating QR codes][1], followed by [generating PDF files][2].

Now, I would like to focus on building microservices around that functionality. We will be creating a few HTTP end-points built with [MicroProfile][4]. I will be using next few posts as an opportunity to show off some of the features that you will be getting out of the box or with minimal effort using MicroProfile.
 
## Getting started

_(Assuming that you have Git, Java 9+, and Maven installed.)_

Since we will continue using the QR code generator project to showcase various features of MicroProfile, it might be a good idea to familiarize yourself with the code. You might want to start with taking a look at my previous two posts that explain the code for [generating QR codes][1], and [generating PDF files][2] in detail.

Now you can clone the [project][8] and examine the Maven dependencies in the [`pom.xml`][7] file, as well as any other MicroProfile related dependencies.

After cloning and opening the project in your favorite IDE, build it (again, assuming that you have Java and Maven installed) with the following command in a terminal:

{% highlight bash %}
$ mvn clean package
{% endhighlight %}

When the project is done building and you have got a `Build Success` from Maven, you can run the project to make sure everything runs fine:

{% highlight bash %}
$ java -jar target/qrcreator.jar
{% endhighlight %}

In a few seconds it takes for the app server to start-up, you should be able to access the starter page at [`http://localhost:8181/qrcreator/index.html`][9].

## Defining End-Points

One of the most obvious features any microservice needs is an end-point to receive requests and respond with some kind of data back. Let's have a closer look into how this is done in MicroProfile. First of all, we will need to define the application path that serves as the base URI for all resource URIs (think of it as a "root" URL) and make sure that the class where it is defined extends `javax.ws.rs.core.Application`, like in [`ApplicationEntryPoint`][19] class here:

{% highlight java %}
package com.mehmandarov.qrcreator;

import javax.ws.rs.ApplicationPath;
import javax.ws.rs.core.Application;

/**
 * Sets the application path that serves as the base URI for
 * all resource URIs provided by @Path annotation.
 */
@ApplicationPath("/api")

public class ApplicationEntryPoint extends Application {
}
{% endhighlight %}

This will set up all the end-point URLs to start with `/api`, in our case [`http://localhost:8181/qrcreator/api/`][17].

#### A (Regular) JSON End-Point

Now, let's define some endpoints. We will start with a most regular kind – a JSON end-point. This is probably the most common end-point you will encounter.

We will start with creating one that would respond to requests sent to [`/api/somestring/json`][18]. Note that as you can see from the code below, `@Path` defines `somestring` in the URL as an `id` that is passed on as an argument to the `createIdKeyTuple` method.

We will also define a type of a request (in this case it is a `GET` request) and specify that it will be returning a JSON document with `@Produces` annotation.

{% highlight java %}
@GET
@Path("{id}/json")
@Produces("application/json")
public Response createIdKeyTuple(@PathParam("id") String id) {
	...
}
{% endhighlight %}

Now, that we are done with annotations for the method, let's have a look at the code for this method, that defines a JSON end-point in the [`QRController`][13] class:

{% highlight java %}
@GET
@Path("{id}/json")
@Produces("application/json")
public Response createIdKeyTuple(@PathParam("id") String id) {
	String nameKeyTuple = null;
	try {
    	nameKeyTuple = qrCodeContentsSupplier.getQRCodeContents(id);
    	return Response.ok(nameKeyTuple).build();
	} catch (InvalidKeySpecException e) {
        e.printStackTrace();
	} catch (NoSuchAlgorithmException e) {
    	e.printStackTrace();
	} catch (Exception e) {
    	e.printStackTrace();
	}
	return Response.serverError().build();
}
{% endhighlight %}

Note that in this code we have only simple exception handling that makes sure we return a correct HTTP status code – OK (200) on a success and server error (500) on an internal error. You can later add other HTTP codes based on your needs.

#### An End-Point Returning an Image

Returning an image instead of a JSON document is quite similar to the code we have already seen. Here we will have to pay attention to three aspects:

* Different MIME type defined in `@Produces` annotation: `@Produces("image/png")`
* Additional elements in the response header that let you control how the created file is displayed in the browser, i.e. shown in the browser "inline", or made available through a download dialog – `"Content-Disposition", "inline;"` (see specs for [`Content-Disposition`][3] for more details)
* Additional elements in the response header that let you control the name for the created file: `filename=\"" + id + ".png\"`

Let's have a look at the whole method:

{% highlight java %}
@GET
@Path("{id}")
@Produces("image/png")
public Response createQR(@PathParam("id") String id) {
	try {
    	byte[] imageData = qrCodeSupplier.qrCodeGenerator(id);
    	return Response.ok(imageData)
            .header("Content-Disposition", "inline; filename=\"" + id + ".png\"")
        	.build();
	} catch (WriterException e) {
    	e.printStackTrace();
	} catch (IOException e) {
    	e.printStackTrace();
	} catch (NoSuchAlgorithmException e) {
    	e.printStackTrace();
	} catch (InvalidKeySpecException e) {
    	e.printStackTrace();
	} catch (Exception e) {
    	e.printStackTrace();
	}
	return Response.serverError().build();
}
{% endhighlight %}

It is worth noting that the number of `catch` statements in the `try...catch` clause will vary and depend on the number and type of exceptions that can be thrown by the underlying methods.

#### An End-Point Returning a PDF

The last method for today – defining an end-point for returning PDF files – is nearly identical to the one we used for returning images, except for one thing:

* Different MIME type and explicit file encoding in `@Produces`: `@Produces("application/pdf; charset=utf-8")`.


{% highlight java %}
@GET
@Path("{id}/pdf")
@Produces("application/pdf; charset=utf-8")
public Response createQRPDF(@PathParam("id") String id) {
	try {
    	byte[] pdfDocument = pdfDocumentSupplier.pdfDocumentGenerator(id);
    	return Response.ok(pdfDocument)
            .header("Content-Disposition", "inline; filename=\"" + id + ".pdf\"")
       	 .build();
	} catch (WriterException e) {
    	e.printStackTrace();
	} catch (IOException e) {
    	e.printStackTrace();
	} catch (NoSuchAlgorithmException e) {
    	e.printStackTrace();
	} catch (InvalidKeySpecException e) {
    	e.printStackTrace();
	} catch (Exception e) {
    	e.printStackTrace();
	}
	return Response.serverError().build();
}
{% endhighlight %}

Of course, there are also obvious differences in the contents of the `byte[]` array, but I consider that being outside the scope of this post – you can study those differences on your own.

## What's Next?

Here we have seen how easy it is to define an end-point that can return documents with various MIME types. In the next posts, we will be taking a closer look at things like how you can equip your end-points with metrics, provide auto-generated documentation based on OpenAPI, and add more resilience with fail-over and circuit-breakers.

---
 
[1]: {{ site.url }}/generating-qr-codes-with-secure-hashes-using-java/
[2]: {{ site.url }}/generating-pdf-files-using-java/
[3]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
[4]: https://microprofile.io/
[5]: https://start.microprofile.io/
[6]: https://www.eclipse.org/community/eclipse_newsletter/2019/february/MicroProfile_Starter.php
[7]: https://github.com/mehmandarov/microprofile-qrcodes/blob/master/pom.xml
[8]: https://github.com/mehmandarov/microprofile-qrcodes/
[9]: http://localhost:8181/qrcreator/index.html
[10]: http://localhost:8181/metrics/
[11]: https://microprofile.io/project/eclipse/microprofile-metrics
[12]: https://www.tomitribe.com/blog/getting-started-with-microprofile-metrics/
[13]: https://github.com/mehmandarov/microprofile-qrcodes/blob/master/src/main/java/com/mehmandarov/qrcreator/QRController.java
[14]: https://github.com/eclipse/microprofile-open-api/blob/master/spec/src/main/asciidoc/microprofile-openapi-spec.adoc
[15]: http://localhost:8181/openapi/
[16]: https://kodnito.com/posts/documenting-rest-api-using-microprofile-openapi-swagger-ui-payara-micro/
[17]: http://localhost:8181/qrcreator/api/
[18]: http://localhost:8181/qrcreator/api/somestring/json
[19]: https://github.com/mehmandarov/microprofile-qrcodes/blob/master/src/main/java/com/mehmandarov/qrcreator/ApplicationEntryPoint.java
