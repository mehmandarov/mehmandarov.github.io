---
title: "Docker Command Line Survival Guide: The Absolute Basics"
layout: post
date: 2017-07-27 08:23 +0200
image: '/assets/images/posts-images/street-art-container_small.jpeg'
description:
tag:
- docker
- field notes
- english
category: blog
star: false
author: rustam.mehmandarov
---

_A brief introduction to ten essential and absolute basic Docker commands to get you started, and keep you going in the command-line interface._

- [Getting Started](#getting-started)
- [Commands, Files, and Folders Inside a Container](#commands-files-and-folders-inside-a-container)
- [Cleanup](#Cleanup)

---

In this post, I decided to share some of the basic commands you might need to get started with Docker. This is neither an extensive list of the commands available, nor all of the commands you might need. This is merely me sharing a prettified list of my cheat sheet for Docker basics with _you_.

## Getting Started

Before we get started, it might be a good idea to note that all of the commands below are written without `sudo`. If your installation is not running without `sudo` (assuming that you are running Linux), you might want to check out the [post-installation guide for Linux][1]{:target="_blank"} in the Docker docs.

#### 1. Check if Everything Works

First things first, you can use this simple command to check that your installation is fine. ___Note:___ Make sure you have right CPU architecture for your images. Raspberry Pi (ARM) things will not run on x86 architecture, and vice versa.

For x86:
{% highlight shell_session %}
$ docker run docker/whalesay cowsay Hello World!
{% endhighlight %}

For Raspberry Pi / AMD:

{% highlight shell_session %}
$ docker run -d -p 80:80 hypriot/rpi-busybox-httpd
{% endhighlight %}

![Hello World][2]{: class="bigger-image" }

#### 2. List Containers

After creating containers, first thing you might want to do is to see what containers you have up and running. To list all running containers you can use:

{% highlight shell_session %}
$ docker ps
{% endhighlight %}

This command will give you a list similar to this:

{% highlight text %}
CONTAINER ID        IMAGE                       COMMAND                  CREATED             STATUS                    PORTS                NAMES
e85753d57a67        easypi/dokuwiki-arm         "/bin/sh -c 'php-f..."   1 days ago          Up 23 hours               0.0.0.0:80->80/tcp   mywiki

{% endhighlight %}

However, it will not show you any stopped containers. To list _all_ local containers use the `-a` option:

{% highlight shell_session %}
$ docker ps -a
{% endhighlight %}

The output will be more like this (note that is shows also stopped, or even failed containers):

{% highlight text %}
CONTAINER ID        IMAGE                       COMMAND                  CREATED             STATUS                    PORTS                NAMES
573193cf1d5e        hypriot/rpi-busybox-httpd   "/bin/busybox http..."   2 days ago          Exited (0) 5 hours ago                         mytest
e85753d57a67        easypi/dokuwiki-arm         "/bin/sh -c 'php-f..."   1 days ago          Up 23 hours               0.0.0.0:80->80/tcp   mywiki

{% endhighlight %}

More on `docker ps` in the [Docker docs][3]{:target="_blank"}.

#### 3. List Images

To list all the images available on your system, simply do this:

{% highlight shell_session %}
$ docker images
{% endhighlight %}

#### 4. Containers vs. Images?

What is the difference between containers and images, you might wonder? Well, I have a [link][4]{:target="_blank"} for you. This will hopefully help you to understand how Docker manages the data within your images and containers.

#### 5. Starting and Stopping Containers

Another two basic commands – [starting][5]{:target="_blank"} and [stopping][6]{:target="_blank"} containers:

{% highlight shell_session %}
$ docker start <container_id>
$ docker stop <container_id>
{% endhighlight %}

___Note:___ The `docker run` command first creates a writeable container layer over the specified image, and then starts it using the specified command. That is, `docker run` is equivalent to the API's `/containers/create`, and then `/containers/<id>/start`.

---

## Commands, Files, and Folders Inside a Container

#### 6. Run Any Command from a Container
You can [run any command][7]{:target="_blank"} in a running container just knowing its ID (or name):

{% highlight shell_session %}
$ docker exec -it <container_id_or_name> echo "Hello from container!"
{% endhighlight %}

#### 7. Getting Into Containers

Since you can run any command, then you can (obviously) also run a shell from a container; if you have any. This will be a bit similar to running an `ssh` command to connect remotely to a regular Linux box (given you have `bash` or `sh` in the container):

{% highlight shell_session %}
$ docker exec -it <container_id_or_name> bash
$ # or:
$ docker exec -it <container_id_or_name> sh
{% endhighlight %}

#### 8. Copy Files From and To Containers

Another useful trick you might need is to copy some files to and from a container. Your friend here is the `docker cp` command ([link to the docs][8]{:target="_blank"}):

{% highlight shell_session %}
$ # To container:
$ docker cp foo.txt <container_name>:/foo.txt
$ # From container:
$ docker cp <container_name>:/foo.txt foo.txt
{% endhighlight %}

---

## Cleanup

After playing round with all the images and containers, you might realize that you have quite a collection of these on your drive, just taking up space.

#### 9. Remove Containers

To remove the unused or unwanted containers, you can run the `docker rm` command with the IDs of those images. The IDs can be retrieved with the `docker ps -a` command, mentioned above.

{% highlight shell_session %}
$ docker rm <container_id>
{% endhighlight %}

#### 10. Remove Images

The `docker rmi` command followed by the IDs of images will help you to remove the unused or unwanted images. The abovementioned `docker images` command will help you finding the correct IDs for the images in question.

{% highlight shell_session %}
$ docker rmi <container_id>
{% endhighlight %}

_Have fun!_

---

[1]:https://docs.docker.com/engine/installation/linux/linux-postinstall/
[2]:{{ site.url }}/assets/images/posts-images/2017-07-27_helloworld-rpi.png
[3]:https://docs.docker.com/v1.11/engine/reference/commandline/ps/
[4]:https://docs.docker.com/engine/userguide/storagedriver/imagesandcontainers/
[5]:https://docs.docker.com/engine/reference/commandline/start/
[6]:https://docs.docker.com/engine/reference/commandline/stop/
[7]:https://docs.docker.com/engine/reference/commandline/exec/
[8]:https://docs.docker.com/edge/engine/reference/commandline/cp/

