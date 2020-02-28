---
title: "Building a Basic Apache Beam Pipeline in 4 Steps"
layout: post
date: 2020-02-21 07:35
image: '/assets/images/posts-images/pipes.jpg'
description: "Getting started with building data pipelines using Apache Beam"
tag:
- java
- apache beam
- data
- pipelines
- english
category: blog
star: false
author: rustam.mehmandarov
---

_Getting started with building data pipelines using Apache Beam._

- [Step 1: Define Pipeline Options](#step-1-define-pipeline-options)
- [Step 2: Create the Pipeline](#step-2-create-the-pipeline)
- [Step 3: Apply Transformations](#step-3-apply-transformations)
- [Step 4: Run it!](#step-4-run-it)
- [Conclusion](#conclusion)

---

In this post, I would like to show you how you can get started with Apache Beam and build the first, simple data pipeline in 4 steps.

## Step 1: Define Pipeline Options

Let's start with creating a helper object to configure our pipelines. This is not an absolute necessity, however defining the pipeline options might save you some time later, especially if your pipeline is dependent on a few arguments, that might have pre-defined, default values that you don't want to provide at every run.

{% highlight java %}
public interface OsloCityBikeOptions extends PipelineOptions {

    /**
     * By default, the code reads from a public dataset containing a subset of
     * bike station metadata for city bikes. Set this option to choose a different input file or glob
     * (i.e. partial names with *, like "*-stations.txt").
     */
    @Description("Path of the file with the availability data")
    @Default.String("src/main/resources/bikedata-stations-example.txt")
    String getStationMetadataInputFile();
    void setStationMetadataInputFile(String value);

    // some other options here...
}
{% endhighlight %}

## Step 2: Create the Pipeline

Now that you have created the pipeline options object, you will need to create the pipeline object itself and provide the options to it: 

{% highlight java %}
OsloCityBikeOptions options = 
        PipelineOptionsFactory.fromArgs(args)
                                .withValidation()
                                .as(OsloCityBikeOptions.class);

Pipeline pipeline = Pipeline.create(options);
{% endhighlight %}

(_Check out the documentation for the [PipelineOptionsFactory][2] class for the description of the methods used above._)


## Step 3: Apply Transformations

After defining the pipeline and providing the options class, we can start by applying the transformations using `.apply(...)`. Those can be chained after each other by applying yet another `.apply(...)`, for instance:

{% highlight java %}
PCollection <KV<Integer, LinkedHashMap>> stationMetadata = pipeline
                .apply("ReadLines: StationMetadataInputFiles", TextIO.read().from(options.getStationMetadataInputFile()))
                .apply("Station Metadata", ParDo.of(fnExtractStationMetaDataFromJSON()));
                .apply(MapElements.into(TypeDescriptor.of(String.class)).via(o -> o.toString()))
                .apply("WriteStationMetaData", TextIO.write().to(options.getMetadataOutput()));
{% endhighlight %}

Note that a [`PCollection<T>`][9] is an immutable collection of values of type `T` and that you can provide names for the transformations as the first string argument in the `apply()`, like in the first two and the last `apply` methods.

Here we can also specify custom transformations that can be done in parallel. In Beam, they are being referred to as [`ParDo`][3] methods. They are similar to the `Mapper` or `Reducer` class of a MapReduce-style algorithm. In this post, we will not be focusing on the contents of such pipeline (i.e. what it is doing), but a simple example of a `ParDo` can be looking like the second `apply` in the code above (look for the link in the [conclusion](#conclusion) for the entire running example).

{% highlight java %}
pipeline.apply("Station Metadata", ParDo.of(fnExtractStationMetaDataFromJSON()));
{% endhighlight %}


## Step 4: Run it!

After defining the pipeline, its options, and how they are connected, we can finally run the pipeline. The great thing about running the pipelines in Apache Beam is that it is very easy to switch between various runners. Beam provides a portable API layer for building sophisticated pipelines that may be executed across various execution engines or _runners_. In our example, we can switch from running the pipeline locally (with [`direct-runner`][4]), to running the same pipeline in the Cloud as a managed service (with [`dataflow-runner`][5]) by simply adjusting the values we provide when running the code.

### Local runner

Here is an example of running the pipeline with `direct-runner`:

{% highlight bash %}
mvn compile exec:java \
      -Pdirect-runner \
      -Dexec.mainClass=com.mehmandarov.beam.OsloCityBike \
      -Dexec.args="--inputFile=src/data-example.txt \
      --output=bikedatalocal"
{% endhighlight %}

### Dataflow runner

And here is the example of running the same pipeline in the Cloud as a managed service, using Google Cloud Dataflow. Note that most of the parameters provided are still the same, with a few additional parameters needed for this specific runner.

{% highlight bash %}
mvn compile exec:java \
      -Pdataflow-runner \
      -Dexec.mainClass=com.mehmandarov.beam.OsloCityBike \
      -Dexec.args="--project=rm-cx-211107 \
      --inputFile=gs://my_oslo_bike_data/data-2018-*.txt \
      --stagingLocation=gs://my_oslo_bike_data/testing \
      --output=gs://my_oslo_bike_data/testing/output \
      --tempLocation=gs://my_oslo_bike_data/testing/ \
      --runner=DataflowRunner \
      --region=europe-west1"
{% endhighlight %}

### Other runners
In case you would like to be using various runners or interested in switching between them, it might be a good idea to check the [capability matrix][6] in the documentation, as the core concepts of Beam Model can sometimes be implemented to varying degrees in each of the Beam runners.

## Conclusion
We have now seen the basic steps needed to create a simple data-parallel processing pipeline and how that can be run and deployed both in the local and managed Cloud environments. We are were also able to run the same pipeline with just a few adjustments to the command line parameters and, in our case, without any changes to the pipeline code.

The entire working example that we have been using here can be found in [my GitHub repository][7], as well as a more advanced example in [another repository][8].


[1]: https://beam.apache.org/
[2]: https://beam.apache.org/releases/javadoc/2.19.0/org/apache/beam/sdk/options/PipelineOptionsFactory.html
[3]: https://beam.apache.org/releases/javadoc/2.19.0/org/apache/beam/sdk/transforms/ParDo.html
[4]: https://beam.apache.org/documentation/runners/direct/
[5]: https://beam.apache.org/documentation/runners/dataflow/
[6]: https://beam.apache.org/documentation/runners/capability-matrix/
[7]: https://github.com/mehmandarov/oslocitybike-basic-beam
[8]: https://github.com/mehmandarov/oslocitybike-beam
[9]: https://beam.apache.org/releases/javadoc/2.19.0/org/apache/beam/sdk/values/PCollection.html
