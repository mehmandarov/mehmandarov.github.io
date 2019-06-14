---
title: "Generating QR Codes With Secure Hashes Using Java"
layout: post
date: 2019-06-10 07:01
image: '/assets/images/posts-images/black-and-white-java.jpg'
description:
tag:
- java
- english
category: blog
star: false
author: rustam.mehmandarov
---

_A step by step tutorial on how to generate QR codes and secure hashed strings with salt in Java._

- [Intro](#intro)
- [Generaring QR Codes](#generating-qr-codes)
- [Hashing Strings](#hashing-strings)
- [What Now?](#what-now)


---

## Intro

I have been testing out new functionality for "checking-in" to a location using QR codes. To make sure the user is at the specified location and is scanning my QR code (and not a "fake" code created by someone else), I needed to add a way of "signing" each code with a value that only I – the provider of the QR code – could know. This would also make it simple enough to be able to implement the same mechanism in the app used to scan the codes to verify the validity on the client side.

I ended up with a solution where I would have a QR code containing a JSON object with a `Name` and a `Key` – a hashed and salted name string. The string will be read by the client app used to scan the code and hashed using the same algorithm with the same secret salt value, and compared to the value in the QR code on the client side. 

The data structure inside a generated QR code would be like this:

{% highlight json %}
{ 
    "Name", "MyString",
    "Key", "HashedMyStringWithSecretSalt"
}
{% endhighlight %}

When it comes to the implementation, I decided to do the generation or codes in Java and, later, implement this as a standalone microservice. Here, I must admit that I was surprised by how simple it was using a specialized library. More about that below.

So, let's have a look at how this can be implemented in your solution – step by step.

## Generating QR Codes

First, I needed a library that can handle QR codes, and I decided to use [Zebra Crossing  ("ZXing")][1] library because of its simplicity and popularity (i.e. community around it). 

All you need to get started is to add the following dependencies to your `pom.xml` (assuming you are using Maven to build your project):

{% highlight xml %}
<dependency>
  <groupId>com.google.zxing</groupId>
  <artifactId>core</artifactId>
  <version>3.4.0</version>
</dependency>
<dependency>
  <groupId>com.google.zxing</groupId>
  <artifactId>javase</artifactId>
  <version>3.4.0</version>
</dependency>
{% endhighlight %}

This library provides quite an extensive functionality both for generating and reading codes. This was more than enough for my use case where I just needed to generate a QR code with a simple JSON object: 

{% highlight java %}
public byte[] qrCodeGenerator(String id) throws IOException, 
                                                WriterException, 
                                                InvalidKeySpecException, 
                                                NoSuchAlgorithmException {

    String filePath = "QRCode.png";
    String charset = "UTF-8";
    Map hintMap = new HashMap();
    hintMap.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.L);

    Map<String, String> qrCodeDataMap = Map.of(
            "Name", id,
            "Key", keyProvider.generateVerificationKey(id) 
            // see next section for ´generateVerificationKey´ method
    );

    String jsonString = new JSONObject(qrCodeDataMap).toString();
    createQRCode(jsonString, filePath, charset, hintMap, 500, 500);

    BufferedImage image = ImageIO.read(new File(filePath));
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    ImageIO.write(image, "png", baos);
    byte[] imageData = baos.toByteArray();

    return imageData;
}

private void createQRCode(String qrCodeData, 
                          String filePath, 
                          String charset, 
                          Map hintMap, 
                          int qrCodeHeight, 
                          int qrCodeWidth) throws WriterException, 
                                                  IOException {

    BitMatrix matrix = new MultiFormatWriter().encode(
            new String(qrCodeData.getBytes(charset), charset),
            BarcodeFormat.QR_CODE,
            qrCodeWidth,
            qrCodeHeight,
            hintMap
    );

    MatrixToImageWriter.writeToPath(
            matrix,
            filePath.substring(filePath.lastIndexOf('.') + 1),
            FileSystems.getDefault().getPath(filePath)
    );
}
{% endhighlight %}

Note also fun little thing – the conversion of Java hashmaps to a JSON object using `JSONObject`. Sometimes it is much easier to build up data structure the way you want it, and then serialize to JSON:

{% highlight java %}
Map<String, String> qrCodeDataMap = Map.of(
        "Name", "SampleText",
        "Key", "SomeHashedValue"
);
String jsonString = new JSONObject(qrCodeDataMap).toString();
{% endhighlight %}

To be able to use `JSONObject` class, you would need to add the following dependency to your `pom.xml`:

{% highlight xml %}
<dependency>
  <groupId>org.json</groupId>
  <artifactId>json</artifactId>
  <version>20180813</version>
</dependency>
{% endhighlight %}

If you are looking for a more simplified interface, you might also check out [QRGen][2] that claims to simplify QR code generation API for Java even further and is built on top ZXing. However, ZXing was absolutely fine in my case.

## Hashing Strings

Now, I needed to be able to hash a string in a quick and secure manner. For this, I decided to use the [method suggested by OWASP for Java][3]. To implement this method you will need to start with updating your `pom.xml`:

{% highlight xml %}
<dependency>
  <groupId>commons-codec</groupId>
  <artifactId>commons-codec</artifactId>
  <version>1.12</version>
</dependency>
{% endhighlight %}

And here is the (somewhat simplified) implmentation of the said method in Java:

{% highlight java %}
public String generateVerificationKey(String str) throws NoSuchAlgorithmException,
                                                         InvalidKeySpecException {
    int iterations = 10000;
    int keyLength = 512;

    char[] strChars = str.toCharArray();
    byte[] saltBytes = salt.getBytes();

    SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA512");
    PBEKeySpec spec = new PBEKeySpec(strChars, saltBytes, iterations, keyLength);
    SecretKey key = skf.generateSecret( spec );
    byte[] hashedBytes = key.getEncoded( );

    return Hex.encodeHexString(hashedBytes);
}
{% endhighlight %}

## What Now?

By now you should be able to generate QR codes with a hashed string. In the next post, I will be sharing code on how to embed and generate PDF files with this information with Java, followed by a post where it all will be put together into a [MicroProfile][4] microservice. Stay tuned!

---

[1]: https://github.com/zxing/zxing
[2]: https://github.com/kenglxn/QRGen
[3]: https://www.owasp.org/index.php/Hashing_Java
[4]: https://microprofile.io/