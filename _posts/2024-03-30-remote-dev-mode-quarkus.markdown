---
title: "Multiplying The Developer Joy: Multiple Quarkus Containers + Simultaneous Remote Development Sessions"
layout: post
date: 2024-03-30 10:50
image: '/assets/images/posts-images/container-ship.jpeg'
tag:
    - english
    - java
    - containers
    - quarkus
    - docker
category: blog
star: false
author: rustam.mehmandarov
---

_Sometimes, you might need to have several Quarkus app containers running on your machine in parallel with the Quarkus' remote development mode activated. It **almost** works out of the box. Keep reading if you want to know how to make it work 100%._

- [Introduction](#introduction)
- [Setup](#setup)
- [Conclusion](#conclusion)


## Introduction

You might have already used the built-in [development mode][1] for Quarkus, which is a great functionality that lets you update the application code, resources, and configurations. Setting it up is a great way to develop your applications _locally_, as you can immediately see the changes reflected in your application.

Additionally, you might have used the [remote development mode][2], which lets you deploy changes to local files immediately available in a containerized environment. Remote development mode works excellently if the container runs in a local Docker or remote containerized environment.

However, running several containers mapped through the same domain simultaneously may result in warnings and erratic behavior.

## Setup

Imagine a setup where you are running a set of containers, for example, using `docker-compose` and mapping them all to `my.cluster.host.com` through several ports (or even `localhost`):

```text
        Containers                Mapped To             
                             ┌──────────────────┐       
    ┌─────────────────┐      │                  │       
    │  service1:8080  ├──────►  localhost:8080  │       
    └─────────────────┘      │                  │       
                             │                  │       
    ┌─────────────────┐      │                  │       
    │  service2:8080  ├──────►  localhost:8081  │       
    └─────────────────┘      │                  │       
                             │                  │       
    ┌─────────────────┐      │                  │       
    │  service3:8080  ├──────►  localhost:8082  │       
    └─────────────────┘      │                  │       
                             └──────────────────┘          
```

First, you will need to update `quarkus.live-reload.url` in the properties for all the apps (see [docs][2] on where and how to do this) to the correct port (in our case, it is `8080`, `8081`, or `8082`):

```properties
quarkus.live-reload.url=http://localhost:8081
```

After updating the `properties` files, try starting your containers with the remote development mode enabled and connect to the application from a terminal or an IDE. For the second and consecutive applications, the attempts to establish a connection you will see the following message in the logs:

```commandline
$> ./mvnw quarkus:remote-dev -Dquarkus.profile=dev

< ... >

[WARNING] Changed debug port to 57409 because of a port conflict
Listening for transport dt_socket at address: 57409

< ... >
```

_**Note:** Ports will be random and may/will vary from the one above._

This setup will break the remote reloading from the terminal. Two or more of your applications now see that the default port `50005` for a remote debug is in use and start with a new, random port. The problem is that the "clients" connecting to the containers to upload your updated code do not know what that new port is.

The simple fix is to update the debug ports for all other applications to something other than `5005`, such as `6006` and `6007`. Custom debug ports can be set in the `pom.xml` files, under `quarkus-maven-plugin`, for each of the applications that requires this update:

```xml
<build>
  <plugins>
    <plugin>
      <groupId>io.quarkus.platform</groupId>
      <artifactId>quarkus-maven-plugin</artifactId>
      <version>${quarkus.platform.version}</version>
      <!-- ADD THE CONFIGURATION MENTIONED BELOW THIS LINE -->
      <configuration>
        <debug>6006</debug>
      </configuration>
...
```

You can choose whether to update the debug ports for all applications in the cluster or for all applications except one, which will get the default port.

Now, you will need to rebuild your Docker images, restart them, and re-initiate the remote development mode for each container. And, voilà, everything works!

**_One last note_**: Please ensure you do not use the remote development functionality in the production environment.

## Conclusion
A tiny config update brings back the development joy of using remote development mode for more than one container simultaneously. **_Happy coding!_**


[1]: https://quarkus.io/guides/maven-tooling#dev-mode/
[2]: https://quarkus.io/guides/maven-tooling#remote-development-mode

