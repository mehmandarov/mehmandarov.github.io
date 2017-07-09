---
title: "Start Docker Containers Automatically"
layout: post
date: 2017-07-09 10:50 +0200
image: '/assets/images/posts-images/whale_small.jpeg'
description:
tag:
- java
- docker
- field notes
- english
blog: true
star: false
author: rustam.mehmandarov
---

_Starting your Docker containers automatically using `systemd`._

- [Introduction](#introduction)
- [Create the Service File](#create-the-service-file)
- [Activate the Service](#activate-the-service)

---

## Introduction

After your Docker containers are set up and running, you might need to be able to start some of them automatically on a reboot or a crash. There are several ways of getting this done.

One of them is to use [restart policies][1]{:target="_blank"} provided by Docker. They can be set to control whether your containers start automatically when they exit, or when Docker restarts. 

Alternatively, you can use a process manager such as `upstart`, `systemd`, or `supervisor` instead. In this post, I want to show you how it is done with [`systemd`][2]{:target="_blank"}.

## Create the Service File

To create a service file that will be used by `systemd` (`systemctl` command), we will first need to get your container name. This can be done by running the following command in your shell:

{% highlight shell_session %}
$ docker ps -a
{% endhighlight %}

The output will look something like this. Select the right container from the list, and note its name in the last column. In this example, we will be using `mywiki` container.

{% highlight text %}
CONTAINER ID        IMAGE                       COMMAND                  CREATED             STATUS                    PORTS                NAMES
573193cf1d5e        hypriot/rpi-busybox-httpd   "/bin/busybox http..."   2 days ago          Exited (0) 5 hours ago                         mytest
e85753d57a67        easypi/dokuwiki-arm         "/bin/sh -c 'php-f..."   1 days ago          Up 23 hours               0.0.0.0:80->80/tcp   mywiki
{% endhighlight %}

Now, we will need to create a file (choose an appropriate file name for the service):

{% highlight shell_session %}
$ sudo nano /etc/systemd/system/docker-dokuwiki.service
{% endhighlight %}

Paste the following into the file. Set a proper `Description`, and make sure to update the container name in `ExecStart` and `ExecStop`:

{% highlight yml %}
[Unit]
Description=DokuWiki Container
Requires=docker.service
After=docker.service

[Service]
Restart=always
ExecStart=/usr/bin/docker start -a mywiki
ExecStop=/usr/bin/docker stop -t 2 mywiki

[Install]
WantedBy=local.target
{% endhighlight %}

A couple of notes about the script above:
1. This file is called a [unit file][4]{:target="_blank"} for `systemd`.
2. Make sure you don't have any extra line brakes within the sections, like `Unit`, or `Service`.
3. The `-a` option in the Docker command for `ExecStart` makes sure it is running in attached mode, i.e. attaching STDOUT/STDERR and forwarding signals.
4. The `-t` option in the Docker command for `ExecStop` specifies seconds to wait for stop before killing the container.

## Activate the Service

Before we can activate the service we have created, we need to reload the unit file. You will also need to run this command any time you do any modifications to the unit files:

{% highlight shell_session %}
$ sudo systemctl daemon-reload
{% endhighlight %}

To activate the service run the following commands (_remember to change the service name_):

{% highlight shell_session %}
$ sudo systemctl start docker-dokuwiki.service
$ sudo systemctl enable docker-dokuwiki.service
{% endhighlight %}

To disable the service run the following commands (_remember to change the service name_):

{% highlight shell_session %}
$ sudo systemctl stop docker-dokuwiki.service
$ sudo systemctl disable docker-dokuwiki.service
{% endhighlight %}

Changes will come to effect on a reboot:

{% highlight shell_session %}
$ sudo reboot
{% endhighlight %}

Now you should have a container that will start on a server reboot, Docker restart, or a crash. _Congratulations!_

As a next step, you might want to look at (external documentation links):

* Adding some more parameters to the [unit file][4]{:target="_blank"}.
* Available [`docker start`][5]{:target="_blank"} options.
* Available [`docker start`][5]{:target="_blank"} options.



[1]:https://docs.docker.com/engine/admin/start-containers-automatically/
[2]:https://freedesktop.org/wiki/Software/systemd/
[3]:https://www.freedesktop.org/software/systemd/man/systemctl.html#daemon-reload
[4]:https://www.freedesktop.org/software/systemd/man/systemd.unit.html
[5]:https://docs.docker.com/engine/reference/commandline/start/
[6]:https://docs.docker.com/engine/reference/commandline/stop/