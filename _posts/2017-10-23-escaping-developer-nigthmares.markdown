---
title: "Escaping Developer Nightmares"
layout: post
date: 2017-10-22 08:23 +0200
image: '/assets/images/posts-images/street-art-container_small.jpeg'
description:
tag:
- java
- field notes
- software development
- english
category: blog
star: false
author: rustam.mehmandarov
---

_A short write up of the bad things we do in software development and some suggestions on how to fix them._

- [The Existing State of Affairs](#the-existing-state-of-affairs)
- [The Moving Parts](#the-moving-parts)
- [Conclusion](#conclusion)

---

Let's take a look into what we can do to achieve a better development environment than an average development project – a project that most of us have seen at some point in our professional lives, or maybe even are a part of right now. We will also look into some tools and patterns that will help us convert those projects into a paradise for the developers.
 
Just a few decades ago, we were working in ways that might look like unproductive, in the best case. Our development models were predominated by waterfalls, our IDEs were basic and we were compiling our projects by hand, using `javac`, or building up the `CLASSPATH` depending on the `GOTO` statements in a huge spaghetti code contained in countless `bat` files. Our code lived in a very simple versioning systems that were not distributed or supported branching strategies that are praised by the developers today. Our documentation lived in `doc` files on shared network drives, side by side with the simple issue tracking systems, that don't even get close to what we have today.

Today, it is all different – we have Git, real issue tracking, IDEs, all that integrated with build servers and collaborative platforms. Yes, everything is much better, more effective and user-friendly, one might think that we are in the paradise already? Well... yes, things are fortunately getting better, however, we are still doing things in a way that might still give you nightmares, several decades from now.

Last years I have been working and invited to evaluate and help with an audit of various projects. Here are some of my observations and thoughts.


## The Existing State of Affairs

This [tweet][10] describes it pretty well:

{% highlight text %}
YOU ARE IN A LEGACY CODEBASE
> RUN TESTS
YOU HAVE NO TESTS
> READ SPEC
YOU HAVE NO SPEC
> WRITE FIX
YOU ARE EATEN BY AN ELDER CODE HACK.
{% endhighlight %}

Some of the issues are, naturally, remnants of the past – the legacy systems; but even those systems and most of the other problems we see today can be avoided if we slightly change our view at some of the main parts of the development process. In most of the cases, we would be aware of those issues, but we might need to explain and motivate the others – often people are responsible for the projects and those who prioritize the development and maintenance backlog.


## The Moving Parts

The road to a great nightmare-free future consists of three components: the code quality, the development and build tools, and a good documentation and collaboration systems. When evaluating systems I often start asking some simple questions listed below to get an idea of the system.

### 1. The Code
#### The Code Quality

First thing off is the general code quality. I often start by asking about simple things – if the project has a coding standard, and if it is being followed. I also ask to take a quick peek at the code and check minor things like file encodings and MIME types. I also follow up with a question if the team is practicing code reviews, and how they are doing that.

While those things alone don't have to mean anything, and are minor issues individually, together with other factors they still are initial indicators of possible neglect. This gives me a possibility to map areas where to look further.

In addition to that, there are also some more specific parts that will be listed as sub-sections below.

#### The third-party libraries
The role of the third party libraries and their use is often forgotten and neglected when considering code and system quality. This is quite unfortunate as this is the part of the code that you might not be able to patch easily, and is harder to maintain compared to your own codebase. Some simple questions that might help you with getting a better grip on your third-party libraries:

* Do you keep track of your third-party libraries?
* Do you regularly check if there are known issues or vulnerabilities in them?
* Do you have a plan for keeping them updated?
* Are the libraries you are using being actively maintained by the authors?
* Are the libraries you are using compatible with each other?
* Do the libraries you are using have appropriate licenses that are compatible with your system? _(This also applies to the open source software licenses.)_

Issues and vulnerabilities are being found and patched all the time. As an example for this, let me point you to Google's [OSS-Fuzz Project][5] that has found [numerous security vulnerabilities][4] in several critical open source projects. Unfortunately, even though many people are aware of the security issues in software in general, the library updates still often tend to be forgotten.

It is also worth noting that while most of the issues on my list above are security related, the last one might be of a legal sort, and probably is the most neglected of the issues listed. 


#### The Architecture

I am often being asked to assess a system and tell something about its architecture compared to more modern systems. The different aspects of the system's architecture will tell a lot about its maintainability both when it comes to further development, bug fixing, and keeping the system running. Some questions that might help with determining the state of the art for that said system would be:

* Does your architecture support automated deployment?
* Does your architecture support continuous deploy and delivery?
* Does your architecture support load balancing?
* Does your architecture support microservices?
* How is the architecture implemented in the code?


#### Tools for Maintaining the Code Quality

Some of this might sound familiar to you and you might be wondering what you can do to improve the code quality? Further steps here would be starting to use proper tools that will be able to tell more about the various aspects of your code. Some of them can be used as plugins to your build system (like Maven), and some could be stand-alone tools:

Stand-alone tools for code analysis:
* [SonarQube][8]
* [PMD][6]
* [FindBugs][7]

Maven plugins to consider (more about plugins in my [previous post][9]):
* Assembly
* Versions
* Dependency
* Enforcer
* Surefire      
* Failsafe
* Sonar
* Findbugs
* pmd

_**Bonus:**_ See this post on [command line tools for Java projects][2].


### 2. Development Tools and Strategies

Now, let's talk about the development tools. All that fancy code and great architecture will not bring you any closer to a developer's paradise if there will not be some proper tools to support the development. The code should live in a proper version control system that supports collaboration and things like branching and tagging. There should also be tools that help you with code quality analysis, static code analysis, etc. A good starting point here would be to start with answering following questions about your project:

* Do you use a proper code versioning tool – Git, or even SVN?
* Do you have a branching (and tagging) strategy?
* Do you have a way of measuring complexity?
* Do you have a way of measuring test coverage and results?
* Do you run static code analysis?

Some tools that can help you here (again, for Java-based systems): 
* **IDEs and IDE plug-ins** that can do checks at commits, integrate with test and QA tools, etc.
* **Build tools:** Maven, Gradle, etc.
* **Continuous integration tools:** Jenkins, TeamCity, Bamboo, etc.
* **Frameworks and tools for testing**: to run unit tests, integration tests, UI tests, and end-to-end tests.


There are some further strategies and questions to consider:

* Are your environments easy to reproduce with minimal efforts – can you rebuild it by simply running a script?
* Do you have a proper pipeline from _packaging_, to _delivery_, to _deploy_?
* To what environments can you deploy automatically? With the same script, or command?
* Are your environments (like _development_, _tesitng_, _staging_, _pre-prod_, _production_) similar to each other? 
* Do you follow the same process to deploy to each environment?
* Are _QA_ and _production_ running on a separate physical hardware?
* Are you monitoring all of the environments? (i.e. are you able to see errors before they make it to _QA_ or even _production_?)


### 3. Documentation and Collaboration Tools

Last, but not least, we will need to talk about the tools for collaboration and documentation. Without these tools, we will be back to the way things were several decades ago – with documents on shared network drives and other horrors of the 90's that I mentioned at the beginning of this post. However, good wikis, other collaboration tools, and proper issue tracking will bring your software to another level, encouraging continuous improvement of the system.

* Wiki
* Collaboration – chat, etc.
* Issue tracking tools

No matter how obvious it might seem, it is still important to note that one should avoid multiple documentation and issue tracking systems. Unfortunately, even though it might sound strange, it is more common than you think – I have seen my share of systems for documentation and issue tracking resulting in fragmented information and confusion.


## Conclusion

There are several challenges connected with having and maintaining the good code quality. The first challenge is that a good code quality is not something you can achieve overnight. It takes time and energy to achieve that and it is a continuous process. You will need some tools, techniques, and methodology to prevail, and it will probably be easier to introduce all that from the beginning of a project.

The second challenge would be that it might be hard to convince the stakeholders of the project to invest time and resources into something that does not bring any visible improvements to the table – things like new features and bug fixes will more likely to get prioritized over something that might not be measured. Actually, while presenting on this topic at JavaOne 2017 in San Francisco, one of the attendees asked me about the ways of getting to a beautiful nightmare-free code and infrastructure, and the ways of convincing the stakeholders that this is the way to go. Unfortunately, there is no one solution to solve it, and the most valuable thing would be to show the real value of the good quality code.

The measurements parameters to show the value can be:

* time it takes from the code is written to deploy,
* system stability,
* how often bugs are reported compared to earlier, or
* frequency of errors in logs.

Finally, what can you do as a developer on a project that might need some help, you might ask? You can just start by suggesting a possible solution and showing the value to the customer or the project manager a good system infrastructure and code gives. Now you just need to keep going and gradually improving the system, one small bit at a time.

---

[1]:https://docs.docker.com/engine/installation/linux/linux-postinstall/
[2]:{{ site.url }}/cmd-tools-for-developers/
[3]:https://en.wikipedia.org/wiki/Spaghetti_code
[4]:https://testing.googleblog.com/2017/05/oss-fuzz-five-months-later-and.html
[5]:https://github.com/google/oss-fuzz
[6]:https://pmd.github.io/
[7]:http://findbugs.sourceforge.net/
[8]:https://www.sonarqube.org/
[9]:{{ site.url }}/five-pillars-of-a-good-maven-project/
[10]:https://twitter.com/brianwisti/status/503987766032494592?lang=en
