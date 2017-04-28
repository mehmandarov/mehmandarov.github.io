---
title: "How to Train Your Camera"
layout: post
date: 2017-04-26 21:46 +0200
image: '/assets/images/posts-images/bird.jpg'
description: Training Camera to Recognize Objects
tag:
- iot
- machine learning
- english
blog: true
star: false
author: rustam.mehmandarov
---

_Image recognition made simple. How to recognise a specific object from a camera feed?_

- [The Challenge](#the-challenge)
- [A Tiny Bit of Theory](#a-tiny-bit-of-theory)
- [Where to Start?](#where-to-start)
- [Doing Image Recognition](#doing-image-recognition)

---

## The Challenge

This week I have been given a challenge to suggest a solution to the following problem:

> *"Given a simple computer, like a Raspberry Pi, a camera and a bird feeder, create a system that can identify the birds feeding there throughout the day."*

Since the question was more of a theoretical kind, I decided to limit this post to introducing the building blocks and giving an explanation about how you would typically build a system like that.

Recognising objects is a pretty common task these days, and it has been solved in quite a few ways by different approaches. Let's have a look at how this works.

> _**TL;DR**_ There are some traditional ways of doing image recognition and object detection, like in OpenCV, and there are some techniques based on Deep Learning object detection, like in TensorFlow. Want to know more? Keep on reading.


## A Tiny Bit of Theory

The more traditional principles behind OpenCV are well described in this [blog post][1]{:target="_blank"}, as well as in this tutorial for detecting (*brace yourselves!*) [cats in images][2]{:target="_blank"}.

While [this post][4]{:target="_blank"} explains how image recognition works in TensorFlow that is using a model called a deep convolutional neural network. Like OpenCV, it will also let you [train your own image classifier][3]{:target="_blank"}.


## Where to Start?

Basically, you have two choices – you should either train your own model, or find a model that has been trained by someone else. The more specific your image classification requirements are, the higher are chances that you will need to train your own model. This will be the same whether you go for OpenCV or TensorFlow.

Since we want to run the model on a relatively low-end computer, you might consider doing the processing in the Cloud. However, it should also be possible to run [OpenCV][5]{:target="_blank"} and [TensorFlow][6]{:target="_blank"} on the latest Raspberry Pis.


## Doing Image Recognition

By now, you should know a bit about the theory. So, let's have a quick look into how we can train the models for our needs. 

> _**TL;DR**_ The way this works, is that you feed the model with quite a few pictures of an object, and the similar amount of images without that object.

Say you want to use the model to recognise birds outside your house in Norway. A good starting point would be to get a list of the typical species you are most likely to see in your backyard and collect as many pictures of each type as possible. Here is what you can do:

1. Start by looking at [Wikipedia][7]{:target="_blank"} for a list of the Norwegian birds, or [Norwegian Encyclopaedia][8]{:target="_blank"} (*in Norwegian*).
2. Search the web for the images of each bird type. You might want to automate that task, and make sure you are picking images with the right copyright permissions.
3. Use those images to train your model.
4. Set up your Raspberry Pi with a camera and the bird feeder, and get ready to identify. You might want to optimise the software not to do the image classification all the time, but only when movement is detected.

In case you wonder if similar systems have been implemented, or if it is even possible. The answer is yes. I will provide you with some links to inspire for further reading:

* [Vehicle Counting][9]{:target="_blank"} with OpenCV
* [Wild flower detection][10]{:target="_blank"} (*in Danish*)

Now, try putting it all together, and let me know how it goes! 

*Good luck!*

[1]: http://www.learnopencv.com/image-recognition-and-object-detection-part1/
[2]: http://www.pyimagesearch.com/2016/06/20/detecting-cats-in-images-with-opencv/
[3]: https://research.googleblog.com/2016/03/train-your-own-image-classifier-with.html
[4]: https://www.tensorflow.org/tutorials/image_recognition
[5]: http://www.pyimagesearch.com/2016/04/18/install-guide-raspberry-pi-3-raspbian-jessie-opencv-3/
[6]: https://svds.com/tensorflow-image-recognition-raspberry-pi/
[7]: https://en.wikipedia.org/wiki/List_of_birds_of_Norway
[8]: https://snl.no/Fugler_i_Norge
[9]: https://www.youtube.com/watch?v=S-W9tMZu8PU
[10]: http://www.fyens.dk/article/3141726?fbrefresh=true
