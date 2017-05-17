---
title: "Command Line Tools for Your Java Projects"
layout: post
date: 2017-05-15 20:46 +0200
image: '/assets/images/posts-images/graph.jpg'
description: Getting an overview of your project with simple command line tools.
tag:
- java
- development
- english
blog: true
star: false
author: rustam.mehmandarov
---

_Getting an overview of your project with some simple command line tools._

- [Introduction](#introduction)
- [Directory Structure](#directory-structure)
- [Code Metrics](#code-metrics)
- [Encoding and MIME types](#encoding-and-mime-types)
- [Dependencies](#dependencies)
- [SonarQube](#sonarqube)

---

## Introduction
This post will give you an overview of some command line tools that will be able to help you to get the feeling on how your project is doing. Most of the tools are widely available in the main Linux distributions and MacOS (some of them might need installation of [Homebrew][3] for Mac). On Windows it can be also made available via [Cygwin][2], or [Bash on Windows][1].

The commands below have been run and tested on a MacOS machine, and might sometimes need some slight modifications to be run on a Linux or a Windows machine. However, it should be able to give an idea of what it is possible to do with these tools. I will also be linking to the documentation for each of the programs in the post. 

---

## Directory Structure
Let's start with something simple. Sometimes all you want to see is the contents and structure of the project without leaving the command line. The `tree` [command][4]  might be able to help you out here. 

It is highly customizable, takes lots of parameters, and is widely available for an installation via most of the package mangers. Command Prompt on Windows also contains a native alternative with the same name.

{% highlight bash %}
$ tree sourcecodefolder/ -L 1 -d
sourcecodefolder
├── src
├── tests
├── sql
└── docs
{% endhighlight %}


## Code Metrics
If you want to see some metrics about the code in your project, like what languages that are used in the project, as well as information about number files, blank lines, comments, and lines of code, you might want to try the `cloc` [command][5] (it stands for *Count Lines of Code*).

Simply install the program and point it at the project directory, or a zip file:

{% highlight bash %}
$ cloc sourcecodefolder/
{% endhighlight %}

It will give you a result that might look something like this:

{% highlight bash %}
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
Java                            33           1226           1026           3017
Python                           4            327            337            888
Markdown                         1             11              0             28
SQL                             10             10             12            212
-------------------------------------------------------------------------------
SUM:                            48           1574           1375           4145
-------------------------------------------------------------------------------
{% endhighlight %}

Also, it is possible to show all the information by percent:

{% highlight bash %}
$ cloc --by-percent cmb sourcecode.zip
{% endhighlight %}

## Encoding and MIME types

Files, within a single project, with different, or wrong, encoding might mean trouble with showing non-ASCII characters correctly. They might even give you compilation errors. Therefore, finding and marking those files as quickly as possible might help you managing your project. 

While MIME types on the other hand are not as bad at causing trouble, the diversity of the MIME types among the same kind of files, like `*.java` files in this example, might indicate lack of standard for developer tools and code standard in the project. 

This kind of information can be extracted with `file` command for each file, or it might be done a bit more automatic for the whole project, and it might look like this: 

{% highlight bash %}
$ find . -name *.java | \
    xargs file -I $1 | \ 
    gawk 'match($0, /.* (.*); charset=(.*)$/, gr) {print gr[2]}' | \
    sort | uniq -c
{% endhighlight %}

A short explanation for the script:

1. find all java files recursively (`find` command)
2. process them with the `file` command
3. grab the output and extract data with regex (`gawk`)
4. sort, extract unique values and count (`sort`, `uniq`)

The result will look something like this:

{% highlight bash %}
 257 iso-8859-1
 117 unknown-8bit
 678 us-ascii
{% endhighlight %}

If you want to drill down a bit further and search for both MIME types and encoding, showing the distribution of encoding per MIME type, you can also extract that from the information supplied by the `file` command like this:

{% highlight bash %}
$ find . -name *.java | \ 
    xargs file -I $1 | \
    gawk 'match($0, /.* (.*); charset=(.*)$/, gr) \
    {print gr[1] " --- " gr[2]}' | \
    sort | uniq -c
{% endhighlight %}

A short explanation for the script is almost the same as above. The only difference is that we use information from both of the regex groups (*gr\[1\]*, and *gr\[2\]*). The result will look something like this:

{% highlight bash %}
  15 text/html --- iso-8859-1
  34 text/html --- us-ascii
 134 text/plain --- iso-8859-1
  16 text/plain --- unknown-8bit
   1 text/plain --- us-ascii
   1 text/x-c --- iso-8859-1
   8 text/x-c --- us-ascii
   5 text/x-c++ --- iso-8859-1
   6 text/x-c++ --- us-ascii
{% endhighlight %}

## Dependencies
Now, over to a bit more advanced stuff – analysing dependencies in your project. Why would you want to do that? Well, in short: dependencies increase complexity, and cyclic dependencies are bad for your project and your health. They also hurt your modularity and complicate the build process.

This kind of analysis can be done with [jdepend][6]. It is easy to run and can be run both separately, and as a part of a build tool, like [Maven][7]. 

For some basic dependency analysis you can also use the command line, and do something like this:

{% highlight bash %}
$ find some_module/ -name *.java | \
    xargs cat $1 | \
    gawk 'match($0, /import (no.*);/, gr) {print gr[1]}' | \
    sort | uniq  | \
    grep -v no.ignore.this.namespace # -v option add strings to ignore
{% endhighlight %}

A short explanation for the script:

1. find all java files recursively (`find` command)
2. print them to console with the `cat` command
3. grab the output and extract import statements with some specific pattern with regex (`gawk`)
4. sort, extract unique values (`sort`, `uniq`)
5. add some namespaces to ignore some strings (`grep` with a `-v` option)

## SonarQube
Last but not least, you might want to load your code for further analysis to [SonarQube][8]. This is an extremely powerful and free tool for doing the static analysis of your code. Normally, you would do that via a plug-in in your continuous integration (CI) software, like [Jenkins][9]. However, there might be some cases when you might want to load this data manually, via a command line.

To load the code to SonarQube you will first need to add a property file in the root directory of each module. It might look like this:

{% highlight text %}
# Contents of sonar-project.properties file:
sonar.projectKey=my:SomeFancyProject
sonar.projectName=My SomeFancyProject
sonar.projectVersion=1.0
sonar.sources=.
sonar.sourceEncoding=ISO-8859-1
{% endhighlight %}

Then you will need to install and run [SonarQube Scanner][10] from each module directory that contains `sonar-project.properties` file:

{% highlight bash %}
sonar-scanner
{% endhighlight %}

As a **_bonus_** feature, I might also suggest that if you don't have time setting up SonarQube on a separate machine, but want quick peek on how your project is doing, you can download and boot up as a [Docker image][11] in no time, and later decide whether you want to create a dedicated machine for running SonarQube, or keep it as it is. Just remember that the database this SonarQube image uses out of the box should not be used for anything other than testing.



[1]:https://msdn.microsoft.com/en-us/commandline/wsl/about
[2]:http://www.cygwin.com/
[3]:https://brew.sh/
[4]:http://mama.indstate.edu/users/ice/tree/
[5]:https://github.com/AlDanial/cloc
[6]:https://github.com/clarkware/jdepend
[7]:http://www.mojohaus.org/jdepend-maven-plugin/
[8]:https://www.sonarqube.org/
[9]:https://jenkins.io/
[10]:https://docs.sonarqube.org/display/SCAN/Analyzing+with+SonarQube+Scanner
[11]:https://store.docker.com/images/sonarqube