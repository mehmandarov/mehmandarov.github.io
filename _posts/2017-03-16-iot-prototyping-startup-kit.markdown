---
title: "Playing with IoT"
layout: post
date: 2017-03-16 11:06 +0200
image: '/assets/images/posts-images/clouds.jpg'
description: Start-up kit for prototyping IoT solutions
tag:
- iot
- english
- conferences
blog: true
star: false
author: rustam.mehmandarov
---

_How to get started prototyping IoT solutions and why should you do that?_

- [Motivation](#motivation)
- [Building Blocks](#building-blocks)
- [Now what?](#now-what)

---

## Motivation

Playing around with Internet of Things (IoT) devices provides several advantages. Apart from the obvious ability to easily prototype systems tailored for your specific needs, it can also give you a more engaging way to gain insight into the tools and infrastructure that usually comes with IoT devices, and is relevant for most of the modern developers:

* Cloud
* Distributed systems
* Data analysis
* Data visualisation
* Machine learning and prediction models

This post is meant to provide you with a simple and minimal set-up to get you started playing around with IoT. I would like to show you just a few devices I have used and provide you with the code examples for them.

---

## Building Blocks

### A Computer Brain
First, we will need something to orchestrate the events, collect the data and communicate with other services, like Cloud services or other machines. It can be a Raspberry Pi, or any other (preferably small) computer. It can also be Arduino, NodeMcu or similar. 

In my case, it is a [Raspberry Pi 2 Model B][1] with Wifi and Bluetooth 4.0 (BTLE) adapters. The Pi will be running Raspbian – a computer operating system, based on Debian (Linux).

### Sensors
Now we need some sensors. It can be anything – sensors connected directly to the Raspberry Pis GPIO pins, or separate sensors that are able to deliver information over the main machine for collection and processing. 

I have good experience using [SensorTag][2] from Texas Instruments. It uses Bluetooth Low Energy for communication and offers quite a few sensors and hardware buttons, such as:

* Infrared and Ambient Temperature Sensor
* Ambient Light Sensor
* Humidity Sensor
* Barometric Pressure Sensor
* 9-axis Motion Tracking Device – Accelerometer, Gyroscope and Compass
* Magnet Sensor
* Hardware buttons

**Getting started code:** You will find some code for getting started with Node.js and SensorTag with examples and references to documentation [here][3].

### Other devices
After setting up a computer to orchestrate the events and getting communication with some sensors up and running, we can add more devices that we can control and/or use to collect more data. In the sections below I have mentioned some of the devices I have been working with, as well as linking to some code examples to get you started.

#### Razberry (Z-Wave)
Since we are using Raspberry Pi, we can extend it even more by using Razberry platform, that brings all the components needed to turn a Raspberry Pi board into a fully operational and inexpensive Z-Wave gateway. Z-Wave is a wireless communication technology often used for smart homes.

**Getting started code:** In [this repo][4] I have provided some information about the REST API and the commands that can be sent through it.

#### Micro:bit
You can also connect some other devices, like this ARM-based embedded system designed by the BBC for use in computer education.

**Getting started code:** [My previous post][7] gives some pointers for getting started, links to the editor and documentation. It also contains some example implementations. 

It should be also possible to connect a micro:bit to a computer or a phone via Bluetooth to send or receive data to or from it.

#### Other 
Previously, I have also used devices like Zumo robots and drones:

* [Zumo robots][9]
* [Parrot drones][10]

Just keep on adding devices, sensors and components as you wish. Sky is the limit!

---

## Now what?
Now that you have connected a bunch of sensors and started collecting some sensor data, we might like to send the data to the cloud, visualize it, or use some machine learning and prediction techniques on that data. Here are some ideas that might help you getting started:

* [Google Firebase][5]: A simple solution for storage and publishing of the data.
* [Mashape.com][6]: A list of different APIs, most of which are available to free, that might give you some ideas on how you can use your data.
* Any simple JavaScript visualization library, like [D3][11], for making your data available in an intuitive way.


[1]: https://www.raspberrypi.org/products/raspberry-pi-2-model-b/
[2]: http://www.ti.com/ww/en/wireless_connectivity/sensortag/tearDown.html
[3]: https://github.com/mehmandarov/sensortag-gettingstarted
[4]: https://github.com/mehmandarov/razberry-gettingstarted
[5]: https://firebase.google.com/
[6]: https://market.mashape.com/explore
[7]: {{ site.url }}/microbit-bluetooth-challenge/
[8]: https://razberry.z-wave.me/
[9]: https://github.com/mehmandarov/myZumo
[10]: https://github.com/voodootikigod/node-rolling-spider
[11]: https://d3js.org/
