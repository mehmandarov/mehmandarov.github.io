---
title: "Cloud Security Principles"
layout: post
date: 2023-10-12 09:50
image: '/assets/images/posts-images/containers.jpg'
tag:
    - english
    - architecture
    - security
    - cloud
category: blog
star: false
author: rustam.mehmandarov
---

_This post was inspired by a talk I have recently done with [Neha Sardana][4] at JAX New York and is meant to serve as a stepping stone to categorize and catalog the things you need to consider working with the Cloud and Cloud-native applications. Some prior knowledge of various concepts within IT architecture and security may be expected for this post._

- [Introduction](#introduction)
- [Key Elements of a Cloud Security Architecture](#key-elements-of-a-cloud-security-architecture)
- [Responsibilities](#responsibilities)
- [Constantly Evolving Landscape](#constantly-evolving-landscape)
- [Platform Security Architecture](#platform-security-architecture)
- [Application Security Architecture](#application-security-architecture)
- [Conclusion](#conclusion)

---

## Introduction
Whether you are running on the Cloud or not it is all about the [CIA triad model][5] – Confidentiality, Integrity, and Availability.

When thinking about Cloud Security Architecture we need to be able to think about the whole stack. Of course, we don’t need to think about all the moving parts alone – it is a shared responsibility between the Cloud service provider and you, the user of the platform.

## Key Elements of a Cloud Security Architecture
Let's first start by defining the key elements of a Cloud Security Architecture, divided across the layers of the stack, based on the Cloud Security Alliance (CSA) stack model.

![Fig.1: Cloud Security Alliance (CSA) stack model] [1]
<figcaption class = "caption">Fig.1: Cloud Security Alliance (CSA) stack model</figcaption>

Now, we can also mention some of the main challenges related to security, divided into separate groups, and try to map them to the CIA triad model that we have mentioned earlier.

### Network and Storage
* Data Encryption
* Network Security

### Application layer
* Application Security
* Logging and Monitoring
* Identity and Access Management (IAM)

### Observability, and traceability
* Incident Response and Recovery
* Vendor and Third-Party Risk Management

### DevOps
* Automation and Orchestration
* Resilience and High Availability

### General
* Compliance and Governance
* User Training and Awareness
* Cloud Provider Security Features

![Fig.2: Challenges of Cloud Security] [2]
<figcaption class = "caption">Fig.2: Challenges of Cloud Security</figcaption>

## Responsibilities
### Shared Responsibility + Intersection of Responsibilities
Addressing all these challenges is a shared responsibility between the Cloud service provider and the customer and the division will vary depending on the type of the solution and whether you are using IaaS, PaaS, or SaaS.

Typically, Cloud service providers will take care of the lower parts of the stack, like physical, infrastructure, and platform security, while customers will be responsible for creating secure applications, securing their data, creating proper Identity and Access Management (IAM), and configuration management.

An effective overlap and a clear understanding of the responsibilities ensure comprehensive security coverage across all layers.

![Fig.3: Shared security responsibility between the Cloud Service providers and the Customers] [3]
<figcaption class = "caption">Fig.3: Shared security responsibility between the Cloud Service providers and the Customers</figcaption>

## Constantly Evolving Landscape
### Evolving Landscape == Constant Change
One of the differentiating factors from regular application development is the constant change and evolution of the platform and tooling on one side, and the constantly evolving types of attacks and possibly larger attack surfaces on the other side.

These factors will lead to changes in the model and the responsibility division. The same might be influenced by the new services being introduced both from the side of the Cloud service provider and the customer (app developer).

Therefore, regular communication between the parties involved and staying updated on their security practices is essential to ensure secure Cloud applications.

## Types of the Cloud Security Architecture
The Cloud Security Architecture is _twofold_ – you will need to choose a _platform_ for running your application and think about the security of the _application_ you will be deploying on that platform.

### Platform Security Architecture
Let’s start with defining the types of platforms and list some of the key elements to consider when choosing a platform type.

#### Public Cloud Security Architecture
* Designed for cloud services provided by third-party vendors (e.g., AWS, Azure, Google Cloud).
* Focuses on securing data and applications hosted on shared infrastructure.
* Utilizes the security features provided by the cloud service provider (CSP) while also implementing * additional security measures.
* Emphasizes network segmentation, encryption, IAM, and monitoring.

#### Private Cloud Security Architecture
* Created for cloud environments dedicated to a single organization.
* Offers more control over security settings and configurations.
* Often used by organizations with strict compliance requirements or sensitive data.
* Implements strong access controls, encryption, and strict network isolation.

#### Hybrid Cloud Security Architecture
* Combines public and private clouds to take advantage of the benefits of both deployment models
* Security architecture addresses integration challenges and ensures consistency across environments
* Emphasizes secure communication between on-premises and cloud components
* Requires seamless identity and access management across both environments

#### Multi-Cloud Security Architecture
* Involves using services from multiple cloud providers simultaneously
* Ensures compatibility and security across diverse cloud platforms
* Requires careful management of authentication, authorization, data protection, and compliance measures
* Aims to prevent vendor lock-in and distribute risk

### Application Security Architecture
Here are some things you will need to think about when developing modern applications for the Cloud and the cloud-native world.

#### 1. Secure Your Code
* Software Supply Chain Security: Securing and monitoring your artifacts and third-party libraries.
* Making sure the code you have written is secure: OWASP Top 10, static code analysis, coding best practices.

#### 2. Your Container (and Serverless) Security Architecture
* Specifically addresses security for containerized applications (e.g., Containers, Kubernetes) and serverless computing (e.g., AWS Lambda, Azure Functions, Cloud Functions, or Cloud Run on Google Cloud)
* Focus on securing microservices, communication between them, their orchestrators, and function-as-a-service (FaaS) platforms
* Involves isolating containers, securing images, and managing runtime security

#### 3. Add DevSecOps Architecture Practices
* Integrate security practices into the DevOps process: DevSecOps
* Ensure security is considered at every stage of application development and deployment
* Involves automated security testing, vulnerability scanning, and security policy enforcement

#### 4. Cross-application and Cross-container communication: Zero Trust Security Architecture
* Assume no trust by default and require strict authentication and authorization for all users and devices
* Focus on identity verification, principle of least privilege, and continuous monitoring
* Suitable for cloud environments where traditional perimeter defenses are less effective

#### 5. Physical security: Edge Cloud Security Architecture
* Address security concerns at the edge of the network, closer to where data is generated and consumed
* In case of having local edge hardware devices consider also physical security of those devices
* Involves considerations like local processing, secure communication, and protection against threats targeting edge devices

#### 6. Compliance-Centric Security Architecture
* Tailored to meet specific regulatory compliance requirements (e.g., GDPR, HIPAA, PCI DSS)
* Focus on implementing controls and safeguards to adhere to relevant standards

## Conclusion
We have seen the key elements of the cloud security architecture and the building blocks of the whole stack. Furthermore, we have looked at the various types and elements to consider when it comes to the security of the platforms and application development. This is a stepping stone to categorize and group some of the main things you will need to consider when working with the Cloud and cloud-native applications.

---
_** Illustrations in this post: Rustam Mehmandarov._

---
[1]: {{ site.url }}/assets/images/posts-images/2023-10-12-fig1.png
[2]: {{ site.url }}/assets/images/posts-images/2023-10-12-fig2.png
[3]: {{ site.url }}/assets/images/posts-images/2023-10-12-fig3.png
[4]: https://linktr.ee/nehasardana
[5]: https://www.techtarget.com/whatis/definition/Confidentiality-integrity-and-availability-CIA
