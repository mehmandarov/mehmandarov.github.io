---
title: "Micro:bit Bluetooth Challenge"
layout: post
date: 2017-03-11 13:06 +0200
image: '/assets/images/posts-images/clouds.jpg'
description: Scissor-Paper-Rock challenge using micro:bit and Bluetooth
tag:
- iot
- python
- english
- conference
blog: true
star: false
author: rustam.mehmandarov
---

_Can you build Scissor-Paper-Rock game using micro:bit and Bluetooth?_

- [The Challenge](#the-challenge)
- [The Building Blocks](#the-building-blocks)
- [Extra](#extra)


---

This post is a challenge for the Race Condition badge at [Arctic IoT Challenge][3]{:target="_blank"}. The description for the badge is as follows:

> At random, the jury will present a challenge. Timeboxed to one hour, the first team with a working solution gets all the points.

This time I am designing the challenge, so here it comes:

---

## The Challenge

We want you to simulate a popular Scissor-Paper-Rock game using micro:bits. Every team gets two devices.

* On shake the micro:bit should pick a random shape (scissors, paper, or rock) and show it using LED array on the device
* The two devices should connect and send the data over to each other
* The opposite device comperes then its own shape to the one received, and decides weather it won or lost.
* Each of the two micro:bits shows then "Won" or "Lost" on the LED array.

---

## The Building Blocks

### Connecting to a micro:bit
Connect the micro:bit to your computer using a micro USB cable. It should appear as a USB disk on your machine.

### Editor and Language
Yan can use Python and the editor here: [http://python.microbit.org/editor.html][1]{:target="_blank"}.

After you are done writing the code, click *Download* and you will get a binary file you will be using in the next step. Check out the [help section][4]{:target="_blank"} for more information.

Python documentation for the API can be found [here][5]{:target="_blank"}.

### Deploying to a micro:bit
Copy the binary *.hex file from the previous step on to the micro:bit, just like you would copy to any USB drive.

### Sending Data Between micro:bits
Now, over to connecting micro:bits and sending data over. Take a look at the example below. Make sure to change *group=1* to a number between 0 and 255. Both chips should belong to the same group to connect to each other. You will be assigned a number.

{% highlight python %}
from microbit import *
from radio import *
from random import*

#turn radio on and 
on()
config(group=1, length=251)

while True:
    if button_a.was_pressed():
        #send the images
        send("Hello, World!")
     
    #receive data    
    data = receive()
    
    #check that we have received any data
    if data != None:
        
        #split the data into different pictures by the marker
        display.scroll(data)

        #clear the screen
        display.clear()
{% endhighlight %}

### The Scissor-Paper-Rock Game
Have a look at the [simple implementation of the game][6]. You will need to translate it to MicroPython and extend.

![Pseudocode for the Scissor-Paper-Rock Game] [7]

---

## Extra
*[Spoiler alert!]* The winning team gets to submit their code to this [GitHub repo][8].

---


[1]: http://python.microbit.org/editor.html
[2]: http://microbit-micropython.readthedocs.io/en/latest/radio.html
[3]: http://ariot.no/Home/Badges
[4]: http://python.microbit.org/help.html
[5]: https://microbit-micropython.readthedocs.io/en/latest/index.html
[6]: https://www.microbit.co.uk/blocks/lessons/rock-paper-scissors/challenges
[7]: {{ site.url }}/assets/images/posts-images/2017-03-11-microbit-bluetooth-challenge-1.jpg
[8]: https://github.com/mehmandarov/scissor-paper-rock-microbit




