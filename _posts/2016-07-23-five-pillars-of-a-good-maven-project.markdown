---
title: "Five Pillars of a Good Maven Project"
layout: post
date: 2016-07-23 08:26 +0200
image: '/assets/images/posts-images/desk-pencils_1200x800.jpg'
description: The five main types of Maven plugins that will simplify the development process and increase maintainability of a project.
tag:
- field notes
- maven
- software development
- build and deploy
- automation
- java
- english
category: blog
star: false
author: rustam.mehmandarov
---

_What makes a Maven project good to work with and easy to maintain? There are five types of Maven plugins that will simplify the development process and increase maintainability of a project._

- [1. Technical Aspects](#1-technical-aspects)
- [2. Legal Aspects](#2-legal-aspects)
- [3. Rapid Development](#3-rapid-development)
- [4. Documentation](#4-documentation)
- [5. Testing and QA](#5-testing-and-qa)
- [Bonus: Video](#bonus-video)


---

[Apache Maven][18] is a build automation tool used primarily for Java projects. It has been around for a while, and it does not seem to be going anywhere anytime soon (whether some of you like it or not). Recently, it has been confirmed yet again, this time in ZeroTurnaround's [Java Tools and Technologies Landscape Report 2016][1] (see the _Build Tools_ section).

The good thing about Maven is that you can do almost anything with it and its plugins. With such a great ecosystem of plugins, able to do nearly anything, one might wonder where to begin when setting up a new Maven project or improving your old one.

I usually like to think of five main categories – or pillars – that we will be looking into in this post. Each category will have a set of example plugins that are meant to serve merely as a starting point. 

In this post, I will assume that you have some experience with build tools in general and Maven in particular.

---

## 1. Technical Aspects

First of all, you would like to make sure that all the technical stuff is in place. You might want to automate the packaging, the checks if the project is running the latest version of all artifacts, that all the dependencies are met, and that the unused dependencies are removed. You might even want to define your own rules for all the things that cause troubles, or just simply annoy you down the line, making the build fail if they are not met. 

With all that automation in place, you will be getting predictable results and nice packaging from the first day of the project.

Some of the plugins that should be mentioned here:

* **[Versions][2] plugin** does the versions management of artifacts in a project's POM file
* **[Dependency][3] plugin** helps you analyzing dependencies, building dependency trees, showing unused dependencies, etc
* **[Assembly][4] plugin** helps you packaging all the dependencies, modules, site documentation, and other files into a single distributable archive
* **[Enforcer][5] plugin** lets you make your own rules! You can set up your build to break if some of your requirements are not met

---

## 2. Legal Aspects

With all the technical stuff out of the way, we might want to make sure that the legal side is taken care of as well. 

Yes, I know, it might be less fun thinking about licenses than writing code, but it is still something that has to be done. You still have to release your code under some kind of license, and you will have to make sure that the third-party licenses do not violate your own licensing. So, why not leave that job to a plugin?

The following plugin will manage the license of a maven project and its dependencies; it will also update file headers, download dependency licenses, check third-party licenses, etc.

* **[License][6] plugin**

---

## 3. Rapid Development

Now, back to coding. Or even better – to seeing the results of your hard work. The chances are that you will need some kind of web or application server for running your code, and you want to able to deploy to that server in no time. Another kind of plugins that will be helping you from the very first day of the project. 

Some of the plugins that can be mentioned here:

* **[Apache Tomcat][7] plugin** 
* **[Jetty][8] plugin** 
* **[WildFly][9] plugin** 
* _...or any other deploy plugin, depending on your application_

---

## 4. Documentation

Every decent project must also be properly documented. However, this is something that developers might postpone until the end. Well, no more! This kind of plugins will help you to get started early and will help you to produce some beautiful (_maybe?_) and maintainable docs.

You might even consider coupling these with some rules in the Enforcer plugin, but tread carefully as too many, and too strict rules can, and usually do, backfire.

* **[Site][10] plugin**
* **[Asciidoctor][11] plugin**

---

## 5. Testing and QA

By now, your code should be looking great, with all the right licenses, and up and running in no time. So, how about squashing some [virtual] bugs? The list below might help you setting up a proper QA environment and fixing bugs before the come crawling to your production servers.

* **[Surefire][12] plugin** 
* **[Failsafe][13] plugin** 
* **[SonarQube][14] plugin** 
* **[FindBugs][15] plugin** 
* **[PMD][16] plugin** 

---

## Bonus: Video

A video of a talk I gave about this topic at [JavaZone][17] in Oslo (in Norwegian).

<iframe src="https://player.vimeo.com/video/138955650?byline=0&portrait=0" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

---

[1]: http://zeroturnaround.com/rebellabs/java-tools-and-technologies-landscape-2016-trends/
[2]: http://www.mojohaus.org/versions-maven-plugin/
[3]: http://maven.apache.org/plugins/maven-dependency-plugin/
[4]: http://maven.apache.org/plugins/maven-assembly-plugin/
[5]: http://maven.apache.org/enforcer/maven-enforcer-plugin/
[6]: http://www.mojohaus.org/license-maven-plugin/
[7]: http://tomcat.apache.org/maven-plugin.html
[8]: https://mvnrepository.com/artifact/org.eclipse.jetty/jetty-maven-plugin
[9]: https://docs.jboss.org/wildfly/plugins/maven/latest/
[10]: https://maven.apache.org/plugins/maven-site-plugin/
[11]: http://asciidoctor.org/docs/asciidoctor-maven-plugin/
[12]: http://maven.apache.org/surefire/maven-surefire-plugin/
[13]: http://maven.apache.org/surefire/maven-failsafe-plugin/
[14]: http://www.mojohaus.org/sonar-maven-plugin/plugin-info.html
[15]: http://gleclaire.github.io/findbugs-maven-plugin/
[16]: https://maven.apache.org/plugins/maven-pmd-plugin/
[17]: http://2015.javazone.no/details.html?talk=86734cc36c24b081d399454534248f3aad7062ce30de5aea27de84f80a476269
[18]: https://maven.apache.org/
