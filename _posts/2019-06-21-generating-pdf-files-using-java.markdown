---
title: "Generating PDF Files Using Java"
layout: post
date: 2019-06-21 07:01
image: '/assets/images/posts-images/pages.jpg'
description:
tag:
- java
- pdf
- english
category: blog
star: false
author: rustam.mehmandarov
---

_A step by step tutorial on how to generate PDF files in Java._

- [Intro](#intro)
- [Choosing a Library](#choosing-a-library)
- [Generaring PDF Files](#generating-pdf-files)
  - [Adding Maven Dependency](#adding-maven-dependency)
  - [Getting Started With the Code](#getting-started-with-the-code)
  - [Adding Text](#adding-text)
  - [Adding Images](#adding-images)
  - [Adding Metadata to the Document](#adding-metadata-to-the-document)
  - [Closing, Saving and Returning the Document](#closing-saving-and-returning-the-document)
- [What Now?](#what-now)


---

## Intro

In my previous post, I have started describing a [system for "checking-in" to a location using QR codes in Java][1]. Now, I would like to describe another part of that system that will show you how to get started with generating PDF files using Java.

So, let's have a look at how this can be implemented in your solution – step by step.

## Choosing a Library

Generating PDFs is normally something you would like to do using 3rd party libraries, and there are quite a few alternatives available. While choosing a library it might be a good idea to have a closer look at the licensing for that library – some of them might be very permissive and some might force your code to comply to a specific licensing. Some libraries even come with dual licensing, one under a proprietary model and one supporting an open source model.

One should also consider other aspects like maturity and whether it is a high- or low-level library. The latter will tell you how much code you will actually end up writing to implement your features. In the course of this project, I ended up trying two different libraries – [iText][6] and, later, [Apache PDFBox][5]. Since the point of this code was a tutorial, I decided to stick with PDFBox as it is distributed under more permissive license – [Apache License 2.0][3], as opposed to dual licensed iText that is under [AGPL][4] and a commercial license.

## Generating PDF Files

As mentioned earlier, this library provides quite extensive functionality for generating PDF files, but it is also quite low-level, so you will have to be prepared to implement a few things you might usually take for granted, e.g. things like calculating coordinates for text that has to be centered on a page and a few other things. However, the library has a great community, so it is quite easy to get help.

#### Adding Maven Dependency
Ok, let's get started. First things first, you will need to add the following dependencies to your `pom.xml` to use PDFBox (assuming you are using Maven to build your project):

{% highlight xml %}
    <dependency>
      <groupId>org.apache.pdfbox</groupId>
      <artifactId>pdfbox</artifactId>
      <version>2.0.15</version>
    </dependency>
{% endhighlight %}

#### Getting Started With the Code
For this post, I decided to paste the source code for the whole function doing the PDF generation and separate it with a few sentences, explaining the most interesting parts of the code. You can always piece the code together, or just have a look at the code in [my repo][7]. (_Bonus: If you are interested in how much work it was to port the code from iText to PDFBox, this [commit][8] should give you a rough idea._)

We start with defining a document object, a page object and add a page to a document. Afterwards, we create a content stream object that will be added to the page and document objects. This object will be responsible for holding the text and images we will be generating here.

{% highlight java %}
// Assume that the following variables are declared and set:
//   QRCodeSupplier qrCodeSupplier - to generate QR codes, shown in the previous post
//   String id - a string that will be shown on the top of the PDF file and used in the QR code
//   String timeZone - a string containing current time zone

String headerTitle = id;
PDFont headerFont = PDType1Font.COURIER_BOLD;

int marginTop = 30;
int fontSize = 30;

PDDocument document = new PDDocument();

PDPage page = new PDPage(PDRectangle.A4);
PDRectangle mediaBox = page.getMediaBox();
document.addPage(page);

PDPageContentStream contentStream = new PDPageContentStream(document, 
                                                            page, 
                                                            PDPageContentStream.AppendMode.APPEND, 
                                                            true);
{% endhighlight %}

#### Adding Text
Now we will need to calculate the coordinates for the header text string and make sure it will appear centered independent of the font and size. This is one of the "low-level" parts you will have to deal with when using PDFBox.

{% highlight java %}
// calculate coordinates to center the header text
float titleWidth = headerFont.getStringWidth(headerTitle) / 1000 * fontSize;
float titleHeight = headerFont.getFontDescriptor().getFontBoundingBox().getHeight() / 1000 * fontSize;
float titleStartX = (mediaBox.getWidth() - titleWidth) / 2;
float titleStartY = mediaBox.getHeight() - marginTop - titleHeight;
{% endhighlight %}

Next, we will be adding the text itself and setting font and coordinates for it on the page:

{% highlight java %}
// add header text to the document
// Note: This solution will not support fixed-width paragraphs and text flow
contentStream.beginText();
contentStream.setFont(headerFont, fontSize);
contentStream.newLineAtOffset(titleStartX, titleStartY);
contentStream.showText(headerTitle);
contentStream.endText();
{% endhighlight %}

#### Adding Images
Now, let's examine how to add an image to a PDF document. Here, you can use `createFromFile()` in case your image is already available, or `createFromImage()` is you are generating the image on the fly and/or returning it from another function. 

Below, you will also find examples of code to scale and to calculate coordinates for centering the image:

{% highlight java %}
// get image as a byte array
ByteArrayInputStream bais = new ByteArrayInputStream(qrCodeSupplier.qrCodeGenerator(id));
BufferedImage bim = ImageIO.read(bais);

// convert image to an object that can be added to the PDF document
PDImageXObject pdImage = LosslessFactory.createFromImage(document, bim);

// calculate coordinates to center the image
float scale = 1f;
int imageOffset = 100;

float imageWidth = pdImage.getWidth() * scale;
float imageHeight = pdImage.getHeight() * scale;
float imageStartX = (mediaBox.getWidth() - imageWidth) / 2;
float imageStartY = titleStartY - imageHeight - imageOffset;

// add image into the document
contentStream.drawImage(pdImage, imageStartX, imageStartY, 
                        pdImage.getWidth() * scale, pdImage.getHeight() * scale);

// closing the stream
contentStream.close();
{% endhighlight %}

#### Adding Metadata to the Document
Here, you can see a few examples of how you can add metadata to your document. This is done with a help of [a few methods available thought the API][9]:

{% highlight java %}
// add metadata
document.getDocumentInformation().setTitle("Generated QR code for " + id + ".");
document.getDocumentInformation().setSubject("with a secure string");
document.getDocumentInformation().setAuthor("rm");
document.getDocumentInformation().setCreator("rm");
document.getDocumentInformation().setCreationDate(date);
{% endhighlight %}

#### Closing, Saving and Returning the Document
After your document is built and you have added all the contents, remember to save and close your document. Now you can either save the document to the file with [`document.save()`][10], or returning the document as a byte array to another function with `byteArrayOutputStream.toByteArray()`:

{% highlight java %}
// save and close document
ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
document.save(byteArrayOutputStream);
document.close();

// return document as byte[]
return byteArrayOutputStream.toByteArray();
{% endhighlight %}


## What Now?

In the last two posts, we have seen how to generate QR codes with a hashed string and PDF files with Java. In the next post, I will be showing how to put it all together into a [MicroProfile][4] microservice.

---

[1]: {{ site.url }}/generating-qr-codes-with-secure-hashes-using-java/
[2]: https://microprofile.io/
[3]: https://tldrlegal.com/license/apache-license-2.0-(apache-2.0)
[4]: https://tldrlegal.com/license/gnu-affero-general-public-license-v3-(agpl-3.0)
[5]: https://pdfbox.apache.org/
[6]: https://itextpdf.com/en
[7]: https://github.com/mehmandarov/microprofile-qrcodes/blob/master/src/main/java/com/mehmandarov/qrcreator/document/PDFDocumentSupplier.java
[8]: https://github.com/mehmandarov/microprofile-qrcodes/commit/bf53ec918dbc0a2e64c1c830aa4995ef63cee52e
[9]: https://pdfbox.apache.org/docs/2.0.13/javadocs/org/apache/pdfbox/pdmodel/PDDocumentInformation.html
[10]: https://pdfbox.apache.org/1.8/cookbook/documentcreation.html