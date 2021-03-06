---
title: "How to Train Your Camera"
layout: post
date: 2017-04-29 20:46 +0200
image: '/assets/images/posts-images/bird_small.jpg'
description: Training your camera to recognize objects using OpenCV or TensorFlow
tag:
- iot
- machine learning
- english
category: blog
star: false
author: rustam.mehmandarov
---
[\[Norwegian version - Norsk versjon\]][16]

_Image recognition made simple. How to recognise a specific object from a camera feed?_

- [The Challenge](#the-challenge)
- [A Tiny Bit of Theory](#a-tiny-bit-of-theory)
- [Where to Start?](#where-to-start)
- [Doing Image Recognition](#doing-image-recognition)

---

## The Challenge

This week I have been given the challenge to suggest a solution to the following problem:

> *"Given a simple computer, like a Raspberry Pi, a camera and a bird feeder, create a system that can identify the birds feeding there throughout the day."*

Since the question was more of a theoretical kind, I decided to limit this post to introducing the building blocks and giving an explanation of how you would typically build a system like that.

Recognising objects is a pretty common task these days, and it has been solved in quite a few ways by different approaches. Let's have a look at how this works.

> _**TL;DR**_ There are some traditional ways of doing image recognition and object detection, like in OpenCV, and there are some techniques based on Deep Learning object detection, like in TensorFlow. Want to know more? Keep on reading.

---

## A Tiny Bit of Theory

The more traditional principles behind OpenCV are well described in this [blog post][1]{:target="_blank"}, as well as in this tutorial for detecting (*brace yourselves!*) [cats in images][2]{:target="_blank"}.

While [this post][4]{:target="_blank"} explains how image recognition works in TensorFlow that is using a model called a deep convolutional neural network. Like OpenCV, it will also let you [train your own image classifier][3]{:target="_blank"}.

![Training your own model][11]{: class="bigger-image" }
<figcaption class = "caption">Someone has to train the model that you will be using for image classification (recognition).</figcaption>

---

## Where to Start?

Basically, you have two choices – you should either train your own model, or find a model that has been trained by someone else, and you might always want to start by looking for a pre-trained model. However, the more specific your image classification requirements are, the higher are chances that you will need to train your own model. This will be the same whether you go for OpenCV or TensorFlow.

Since we want to run the model on a relatively low-end computer, you might consider doing the processing in the Cloud. However, it should also be possible to run [OpenCV][5]{:target="_blank"} and [TensorFlow][6]{:target="_blank"} on the latest Raspberry Pis.

---

## Doing Image Recognition

By now, you should know a bit about the theory. So, let's have a quick look into how we can train the models for our needs. 

> _**TL;DR**_ The way this works, is that you feed the model with quite a few pictures of an object, and the similar amount of images without that object.

Say you want to use the model to recognize birds outside your house in Norway. A good starting point would be to get a list of the typical species you are most likely to see in your backyard and collect as many pictures of each type as possible. 

![Your own model in action][12]{: class="bigger-image" }
<figcaption class = "caption">Your trained model in action.</figcaption>

Here is what you can do:

1. Start by looking at [Wikipedia][7]{:target="_blank"} for a list of the Norwegian birds, or [Norwegian Encyclopaedia][8]{:target="_blank"} (*in Norwegian*).
2. Search the web for the images of each bird type. You might want to automate that task and make sure you are picking images with the right copyright permissions.
3. Use those images to train your model.
4. Set up your Raspberry Pi with a camera and the bird feeder, and get ready to identify. You might want to optimise the software not to do the image classification all the time, but only when movement is detected. 

*Pro tip:* It might also be a bit challenging to take a good picture of our feathered friends, so make sure your camera is well-placed, and the feeder is in a well-lit location. Obviously, without disturbing the wildlife.

In case you wonder if similar systems have been implemented, or if it is even possible. The answer is yes. I will provide you with some links to inspire for further reading:

* [A Bird Classifier with Tensorflow][15]{:target="_blank"}
* [Training a Bird Classifier with Tensorflow and TFLearn][14]{:target="_blank"}
* [Vehicle classification and Counting with OpenCV][9]{:target="_blank"}
* [Wild Flower Detection][10]{:target="_blank"} (*in Danish*)
* [Machine Learning is Fun! Part 3: Deep Learning and Convolutional Neural Networks][13]{:target="_blank"}. (*Also, check out the other parts of the article series.*)

Now, try putting it all together, and let me know how it goes! 

*Good luck!*

---

[1]: http://www.learnopencv.com/image-recognition-and-object-detection-part1/
[2]: http://www.pyimagesearch.com/2016/06/20/detecting-cats-in-images-with-opencv/
[3]: https://research.googleblog.com/2016/03/train-your-own-image-classifier-with.html
[4]: https://www.tensorflow.org/tutorials/keras/basic_classification
[5]: http://www.pyimagesearch.com/2016/04/18/install-guide-raspberry-pi-3-raspbian-jessie-opencv-3/
[6]: https://svds.com/tensorflow-image-recognition-raspberry-pi/
[7]: https://en.wikipedia.org/wiki/List_of_birds_of_Norway
[8]: https://snl.no/Fugler_i_Norge
[9]: https://www.youtube.com/watch?v=S-W9tMZu8PU
[10]: https://web.archive.org/web/20170925210229/http://www.fyens.dk/article/3141726
[11]: {{ site.url }}/assets/images/posts-images/2017-04-29-cartoon_image_processing_1.png
[12]: {{ site.url }}/assets/images/posts-images/2017-04-29-cartoon_image_processing_2.png
[13]: https://medium.com/@ageitgey/machine-learning-is-fun-part-3-deep-learning-and-convolutional-neural-networks-f40359318721
[14]: https://web.archive.org/web/20161205073600/http://www.bitfusion.io:80/2016/08/31/training-a-bird-classifier-with-tensorflow-and-tflearn/
[15]: https://www.oreilly.com/learning/dive-into-tensorflow-with-linux
[16]: {{ site.url }}/hvordan-laere-opp-ditt-eget-kamera/
