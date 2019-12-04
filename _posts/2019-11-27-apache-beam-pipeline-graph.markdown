---
title: "Getting a Graph Representation of a Pipeline in Apache Beam"
layout: post
date: 2019-11-27 08:15
image: '/assets/images/posts-images/golden-gate.jpg'
description:
tag:
- java
- apachebeam
- data
- pipelines
- english
category: blog
star: false
author: rustam.mehmandarov
---

_Getting a pipeline representation in Apache Beam explained step-by-step._

- [Intro](#intro)
- [TL;DR: Getting Graph Representation](#tldr-getting-graph-representation)
- [A Full Example](#a-full-example)
- [What Now?](#what-now)

---

## Intro
Constructing advanced pipelines, or trying to wrap your head around the existing pipelines, in [Apache Beam][1] can sometimes be challenging. We have seen some nice visual representations of the pipelines in the managed Cloud versions of this software, but figuring out how to get a graph representation of the pipeline required a little bit of research. Here is how it is done in a few steps using Beam's Java SDK.


## TL;DR: Getting Graph Representation

If you just want to see a few lines that let you generate the [DOT][7] representation of the graph, here it is:

{% highlight java %}
import org.apache.beam.runners.core.construction.renderer.PipelineDotRenderer;

Pipeline p = Pipeline.create(options);
// do stuff with your pipeline
String dotString = PipelineDotRenderer.toDotString(p);
{% endhighlight %}

Now, if you want a slightly more comprehensive example, keep on reading.


## A Full Example
Here we will be using [word count example][2], particularly the [`MinimalWordCount`][3] class. 

#### Adding Maven Dependency
First, we need to add a dependency to the Maven file under `<dependencies>` section:

{% highlight xml %}
<dependencies>
    <!-- ... all the other dependencies you may have -->
    <dependency>
        <groupId>org.apache.beam</groupId>
        <artifactId>beam-runners-core-construction-java</artifactId>
        <version>${beam.version}</version>
    </dependency>
</dependencies>
{% endhighlight %}


#### The Code
Now, we will need to add a few imports (assuming you already added the Maven dependency mentioned earlier):

{% highlight java %}
import org.apache.beam.runners.core.construction.renderer.PipelineDotRenderer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
{% endhighlight %}

To get the [DOT][7] representation of the pipeline graph we will be passing the pipeline object to the `PipelineDotRenderer` class, and in this example, we are only logging the output to the console (hence the log4j imports).

{% highlight java %}
// Create the Pipeline object with the options we defined above
Pipeline p = Pipeline.create(options);

// ... do stuff with your pipeline ...

// Add this piece of code just before running the pipeline:
final Logger log = LoggerFactory.getLogger(MinimalWordCount.class);
String dotString = PipelineDotRenderer.toDotString(p);
log.info("MY GRAPH REPR: " + dotString);

p.run().waitUntilFinish();
{% endhighlight %}

That's it. To see the code in action, run it from the command line:

{% highlight bash %}
$ mvn compile exec:java \
        -Dexec.mainClass=org.apache.beam.examples.MinimalWordCount \
        -Pdirect-runner
{% endhighlight %}

This code will produce a DOT representation of the pipeline and log it to the console.

#### A Complete Example

A fully working example can be found in [my repository][8], based on [`MinimalWordCount`][3]
code. There, in addition to logging to the console, we will be storing the DOT representation to a file.

In the next section, we will have a brief look at what can be done with the DOT representations.

## What Now?
Now that we have a DOT representation of the pipeline graph, we can use it to get a better understanding of the pipeline. For instance, you can generate an SVG or a PNG image from the data. Note that the generated graph might be a bit verbose, but gives a good overview of the pipeline graph.

Here, I have also included examples of the [DOT graph][10] and the [PNG file][11] generated for that particular pipeline.

Assuming that you have Graphviz [tools][9] installed, you can convert a DOT file to a PNG image using this command:

{% highlight bash %}
$ dot -Tpng -o pipeline_graph.png pipeline_graph.dot
{% endhighlight %}

In addition to [Grapgviz][4] (Wikipedia [link][5]), there are also online services for converting DOT graphs to graphical representations, like [this][6] one.

![Training your own model][12]{: class="bigger-image" }
<figcaption class = "caption">A part of a graphical representation for the pipeline in the MinimalWordCount example. </figcaption>

---

[1]: https://beam.apache.org/
[2]: https://beam.apache.org/get-started/quickstart-java/#get-the-wordcount-code
[3]: https://github.com/apache/beam/blob/master/examples/java/src/main/java/org/apache/beam/examples/MinimalWordCount.java
[4]: https://www.graphviz.org/
[5]: https://en.wikipedia.org/wiki/Graphviz
[6]: https://dreampuf.github.io/GraphvizOnline
[7]: https://en.wikipedia.org/wiki/DOT_(graph_description_language)
[8]: https://github.com/mehmandarov/word-count-mini-beam
[9]: https://www.graphviz.org/download/
[10]: https://github.com/mehmandarov/word-count-mini-beam/blob/master/pipeline_graph.dot
[11]: https://github.com/mehmandarov/word-count-mini-beam/blob/master/pipeline_graph.png
[12]: https://raw.githubusercontent.com/mehmandarov/word-count-mini-beam/master/pipeline_graph_partial.png