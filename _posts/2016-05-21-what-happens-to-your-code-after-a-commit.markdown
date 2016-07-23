---
title: "What Happens to Your Code After a Commit?"
layout: post
date: 2016-05-21 9:45
tag:
- automation
- deploy
- continuous delivery
- build
- testing
- english
blog: true
star: false
author: rustam.mehmandarov
---


_I have written an article for the student magazine INDEX at the Department for Informatics (Ifi), University of Oslo. It was published on 30.04.2016, in Norwegian, and I have [previously shared it][3] with you here. I was also asked to share an English version of the article. This post is not only a simple translation to English, but rather a 2.0 version of the previous post._

- [Automation](#automation)
- [Automatic tests and code quality checks](#automatic-tests-and-code-quality-checks)
- [Environments](#environments)
- [Versions](#versions)
- [What now?](#what-now)

![The Screenshot of the Article][1]

---

Imagine the following scenario: You are a student and have been asked to write either a brand new program or make changes to a code that already exists. So, how do you proceed? You start writing code, you compile and run it periodically to test that it runs and does what it should. You write some more code, you run it again. The process goes on until you are satisfied and the code has to be delivered. After that, you package it nicely with some documentation, upload it to a page where it has to be delivered, and wait for feedback. Sounds familiar?

The process is not so far away from what you might experience at a workplace – just in miniature form. You have someone who orders functionality – in this case, your teacher, but later a customer or product owner – and you have one or several deliveries to be shipped. From a functional perspective you will want to be sure of three things: that the ordered functionality is implemented, that the new code does not mess up anything else, and that the code will behave the same way it does for you when the customer runs it on their machines or servers.

This simple "code-test-code" method works fine for small tasks, but what would you do if you were working on a large project with several colleagues, or even teams, working on different parts of the codebase? How can you check that your code still works when you have made your changes? How can you be sure that your changes have not messed up others' code? And, how can you ensure that code that works on your machine still works when you deliver it to the customer?

Welcome to my workday. I often work with large IT systems consisting of hundreds of thousands lines of code and with dozens of developers working on different parts of the code. In addition to being a technical project manager with overall responsibility for the solution including application architecture, build infrastructure, and environments the solution runs on, I have often had the role of delivery manager. The latter is responsible for making sure that the final package that is being delivered contains all the code and functionality. Each delivery must have all the bits included, they must work properly, and the recipients of the package will have to be able to install the software on their systems without any surprises.

---

## Automation

A process to build, deploy and deliver a system consists of several steps, and most of them can usually be automated. 

There are many reasons why you might want to automate this process. One reason is that it should be easier for you, and everyone else, to build the system. Automation shortens the time it takes to build it, making it easier to test a change you made to the codebase. 

The second reason is that it makes it easier for others to take over or help on a project without having to familiarize themselves with the entire build process to get started. It will also make it easier to build with different build configurations. In addition to all this, it will also eliminate the human factor in the whole process – we humans make mistakes, and by automating the manual labor we minimize the chance of making those errors.

Depending on the task at hand, the automation can be achieved by using various tools. Everything from simple make and shell scripts, to a sophisticated build tools, like _Apache Maven_ and _Gradle_, can help you reaching your goals. Most often it will be not one, but a combination of the above mentioned tools. These can help you with both general automation of builds and deploy process, and automating the steps that will be described below.

![CI to the Rescue] [2]
<figcaption class = "caption"> Illustration made after my drawings, and for this article by Mahasty Assi</figcaption>

---

## Automatic tests and code quality checks

Once the code is written and the build can be achieved with a single press of a button or by running a single script, you can begin to look at another important part of automation – running tests and managing code quality. 

The automatic tests can be run both at a low level - _unit tests_, and at the functional level. Unit tests check that your methods are working properly, for example that, given some specific input parameters, they return an expected answer. The _functional tests_ on the other hand, will test the system as a whole, helping you to determine whether your system can still perform a set of specific tasks it was designed to do. There is also a third kind of tests that can, and should, be automated – _integration tests_. These are the tests used to check if the system is communicating with other systems in the way it was intended.

A failing test – no matter type – can tell you that something dramatic has happened in your system and that the system has ceased to behave as expected, giving you an opportunity to spot potential errors much earlier in the development process.

Another way to discover hidden problems is to run static code analysis that can detect known errors patterns, security weaknesses, bad coding habits, or unnecessary complexity. _PMD_, _FindBugs_ and _SonarQube_ can be mentioned as an example of tools for code quality management in Java world (while _NDepend_, _StyleCop_ and _SonarQube_ can be used for .NET projects).

---

## Environments

When developing a system one should know which environment and setup the system will run on when it goes live, i.e. when it gets deployed to a production environment. This information will help you to set up similar environments for development, and especially for testing. This is an important step in detecting errors that may occur only with a specific set-up, or specific hardware. When these environments are set up, you can also automate deployment of your code. This can be very convenient and save you a lot of time: imagine that you push a change to a version control system (because you are using a [VCS][4], right?), and it's out in a suitable environment – ready to be tested or demonstrated in no time, and with no effort from your side.

---

## Versions

Versioning of the code and the applications will make sure you can easily answer two important questions:

* Which version of the code is running here?
* What functionality is part of the particular version of the application?

Both of these questions are something you are going to ask yourself and will be asked by others. The answers to these will help you when fixing or reporting bugs, or working on a new functionality that is being rolled out. 

If you are creating a larger system, you will also need this information when writing Release Notes for the latest version. 

Versions will also help you keep track of and updating documentation for your system.

---

## What now?

Automation of build and deploy is a complex topic. The points that I mentioned here can be used as a starting point – a kind of checklist for a better system. You do not need to do everything at once, or go in depth on all points. You should rather start with one of them and work your way towards full automation.

These points - and a few more - is part of a continuous delivery process that is designed to ensure that it will only take a few minutes between pushing a change to version control system till it is live in production. You do not need to go that far in the beginning, but it may be something to strive for. 

These points may seem tedious, but they will often have an immediate effect on your development process – they will simplify the entire process of handling a system, so you can spend more time on what you like best, namely programming!


[1]: {{ site.url }}/assets/images/posts-images/2016-05-16-hva-skjer-med-koden-din etter-at-du-har-skrevet-den-ferdig_article-2016-04-27_full.png
[2]: {{ site.url }}/assets/images/posts-images/2016-05-16-hva-skjer-med-koden-din etter-at-du-har-skrevet-den-ferdig_ci-superhero.png
[3]: {{ site.url }}/hva-skjer-med-koden-din-etter-at-du-har-skrevet-den-ferdig/
[4]: https://en.wikipedia.org/wiki/Version_control