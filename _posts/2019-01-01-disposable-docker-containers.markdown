---
title: "Disposable Docker Containers"
layout: post
date: 2019-01-01 11:01
image: '/assets/images/posts-images/containers.jpg'
description:
tag:
- containers
- docker
- jekyll
- field notes
- english
category: blog
star: false
author: rustam.mehmandarov
---

_Disposable containers may sound like a tautology. However, here we will be looking into single-use, ephemeral containers – even in the context of the containers – that are used for building and testing applications, and disposing of them shortly after._

---

Containers are something that we use to run our applications and, normally, we dispose of the whole container when we build a new version of the application or need to upgrade something in the setup. This means that containers are generally having a short lifespan.

However, in this case, I want to show you how to build something that exists for an even shorter period of time and that can be used as an alternative to a local setup for building and testing applications locally before pushing it to test, staging, production, etc.

This is a simplified example of what is being done on a much bigger scale with moving your CI/CD pipelines to such disposable containers, and with libraries like [Testcontainers][2].

In this case, I would like to show you how to setup Jekyll applications, but this can be easily applied to any kind of applications written in any of your favorite languages, like Java or Python. Until recently, I have been running a Jekyll installation locally with all dependencies installed on my machine. However, it has been a bit challenging when moving between machines and reinstalling operating systems. To simplify the process, I decided to containerize the local build and test processes. 

I wanted the following:

* To build my code from and to the local folder on my (host) machine
* Run the application (in this case this blog) from a local folder on my (host) machine
* Avoid setting up the environment, or have a minimal and portable setup
* Avoid environment clean-up – I didn't want to hold on to the unnecessary containers and container images

## _**TL;DR**_: The solution 
_**(see next section for the explanation)**_

{% highlight bash %}
$ export JEKYLL_VERSION=3.8
$ docker run --rm --volume="$PWD:/srv/jekyll" \
       -it jekyll/jekyll:$JEKYLL_VERSION jekyll build
$ docker run --name newblog --volume="$PWD:/srv/jekyll" -p 4000:4000 \
       -it jekyll/jekyll:$JEKYLL_VERSION jekyll serve --watch --drafts
{% endhighlight %}

## Explanation – line by line

So, let's take a closer look at each of the lines:

{% highlight bash %}
1: export JEKYLL_VERSION=3.8
{% endhighlight %}

Just setting up versions that will be used later – a bit of housekeeping. Nothing exciting here.

---

{% highlight bash %}
2: docker run --rm --volume="$PWD:/srv/jekyll" \
        -it jekyll/jekyll:$JEKYLL_VERSION jekyll build
{% endhighlight %}

Here, we build the code and output it to the same disk volume as the source code, i.e. the volume that is shared with my host machine. Now I have the built version on my machine without the hassle of setting up the local build environment. In addition to that, I will be doing some clean-up, by deleting the build container after the build job is finished.

* `--rm` – just execute the command and clean-up (remove the container, file system, etc.)
* `--volume` – mapping the current directory to `/srv/jekyll` in the container
* `-it` instructs Docker to allocate a pseudo-TTY connected to the container’s stdin; creating an interactive shell in the container
    * `-i` – attach container’s STDIN
    * `-t` – allocate a pseudo-TTY
* `jekyll/jekyll:$JEKYLL_VERSION` – Docker [image][1] to use and the tag
* `jekyll build` – command to run

---

{% highlight bash %}
3. docker run --name newblog --volume="$PWD:/srv/jekyll" -p 4000:4000 \
        -it jekyll/jekyll:$JEKYLL_VERSION jekyll serve --watch --drafts
{% endhighlight %}

This will create another container that will be running our application. Here we will need to add a few other parameters – like mapping the container ports to the ports on the local machine and giving the container a name.

* `--name newblog` – give your container a name
* `--volume` – mapping the current directory to `/srv/jekyll` in the container
* `-p` – bind port 4000 of the container to TCP port 4000 (`-p host_machine:container`)
* `-it` instructs Docker to allocate a pseudo-TTY connected to the container’s stdin; creating an interactive shell in the container
    * `-i` – attach container's STDIN
    * `-t` – allocate a pseudo-TTY
* `jekyll/jekyll:$JEKYLL_VERSION` – Docker [image][1] to use and the tag
* `jekyll serve --watch --drafts` – command to run

Now you can stop the container with `CTRL+c`, and restart it again with: 

{% highlight bash %}
$ docker start newblog -i
{% endhighlight %}

If you don't want the container being persistent on your system, you can simply add `--rm` as in the previous command:

{% highlight bash %}
$ docker run --rm --name newblog --volume="$PWD:/srv/jekyll" -p 4000:4000 \
       -it jekyll/jekyll:$JEKYLL_VERSION jekyll serve --watch --drafts
{% endhighlight %}

---

[1]: https://github.com/envygeeks/jekyll-docker/blob/master/README.md
[2]: https://www.testcontainers.org/
