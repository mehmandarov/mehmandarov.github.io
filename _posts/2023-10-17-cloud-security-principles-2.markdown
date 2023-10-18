---
title: "Cloud Security Principles: Part 2"
layout: post
date: 2023-10-17 15:50
image: '/assets/images/posts-images/container-ship.jpeg'
tag:
    - english
    - architecture
    - security
    - Cloud
category: blog
star: false
author: rustam.mehmandarov
---

_This is the second part of the series on the Cloud Security Principles. This post will look at some key principles for securing your applications. Similarly to the [first post][1], some prior knowledge of various IT architecture and security concepts may be expected. This post was inspired by a talk I have recently done with [Neha Sardana][2] at JAX New York._

- [Introduction](#introduction)
- [Principles](#principles)
- [Conclusion](#conclusion)

---

## Introduction
[In the first part][1], we have summed up all the essential elements to consider when working with Cloud and securing cloud-native applications/platforms. In this post, we would like to give you some concrete principles and tips for creating more secure applications.


## Principles
### Multi-Layered Defense
_**Keywords**_: `general`

First of all, a more generic but important principle: It would be best to look at security as a whole – integrating various security layers on multiple levels in any system. It should include cyber-security plans for:

1. Devices
2. Applications
3. Networks
4. Infrastructure
5. People

Think of this principle as all the layers of clothing you wear to protect yourself from cold and bad weather. If one of the layers is compromised, there is always another to keep you warm and dry.

### Identity and Access Management (IAM) Misconfiguration
_**Keywords**_: `network`, `permissions`

You need to control access and permissions meticulously and over time.
Things to consider:
* Implementing role-based access control (RBAC)
* Principle of least privilege
* Routines for updating and removing permissions when they are no longer needed. 
* Explore possibilities for using time-based conditions for IAM policies.

### API Security
_**Keywords**_: `endpoints`, `permissions`

* APIs act as the gateways to your application and data. Securing access to and securing them from known vulnerabilities is paramount to prevent unauthorized access and data breaches.
* Utilize _authentication_, _authorization_, and _API gateways_ to control access and protect sensitive information. Don't forget to monitor the software or libraries that make APIs available (e.g., runtimes, middleware)

### Data Encryption
_**Keywords**_: `data`

* Safeguarding data at rest, in transit, and during processing is critical for your applications.
* Utilize encryption, tokenization, and data masking techniques to ensure data protection. Removing unnecessary sensitive information can simplify some of these tasks.
* If a platform or a Cloud provider provides the encryption, consider if you would like to use the standard keys for encryption or "bring your own" and manage them yourself or through a third party.
* Beware: Don't write your own crypto! Ever.

### Zero Trust
_**Keywords**_: `network`, `permissions`

* The Zero Trust security model assumes that no one is inherently trustworthy, even those within your network.
* This is opposed to more traditional approaches where perimeter security was prioritized over security inside the network.
* Adopting this approach, every request, user, and device is thoroughly verified before gaining access.
* Again: Implement the principle of least privilege, where users are only granted the minimum level of access required to perform their tasks.

### Software Supply Chain Security
_**Keywords**_: `software`, `environment`

* Create [Software Bill of Materials (SBOM)][3] for your software
* Governance: Know where all the building blocks (artifacts) of your software are coming from.
* Automate security checks within your CI/CD pipeline to catch vulnerabilities early and often.
* Use static code analysis with tools like SonarQube to scan your code for potential security flaws and integrate those checks into your CI/CD pipeline to ensure continuous security monitoring.
* Use tools to monitor not only the code you develop yourself but also all the third-party libraries you utilize in your code.
* With DevSecOps, automated security security is becoming integral to the development process. Adopt it if you haven't done so already.

### Secure Containerization
_**Keywords**_: `software`, `environment`

* Containerization and orchestration technologies, like Docker and Kubernetes, offer exceptional flexibility but also introduce security concerns.
* Securing containers and managing their lifecycle is vital to ensure a safe cloud environment.
* For example, use container scanning tools to identify vulnerabilities within container images before deploying them.
* Additionally, enforce strict security policies and segregate workloads using Kubernetes namespaces.

### Continuous Monitoring and Incident Response
_**Keywords**_: `software`, `environment`

* The cloud landscape is constantly changing, and threats evolve rapidly. This means that we need to monitor not only for known threats but also for anomalies.
* Continuous monitoring and proactive incident response are essential to detect anomalies and respond swiftly to security incidents.
* For example, use cloud-native monitoring tools your Cloud or platform provider provides.
* Have good logging, but remember that more is not always better – log relevant information.

### Human Factor (including Social Engineering, Misconfigurations, Human Errors)
_**Keywords**_: `people`, `human factor`

* 82% of incidents are caused by human factors ([2022 Data Breach Investigations Report][4])
* Creating secure applications also implies providing security training for the system users.
* Social engineering and human factor has proven to be essential to creating secure applications.
* Consider running security awareness campaigns and employee training from user and developer perspectives.
* Automate routine and mundane tasks – humans often don't enjoy carrying out tasks like this and are prone to errors; computers, on the other hand, excel at tasks like this!

## Conclusion
You have probably heard that nothing is stronger than its weakest link. Therefore, it is important to look at various sides of the security. Especially in the Cloud, one size does not fit all when it comes to security. Cloud platforms, software, and threats constantly evolve and add to the complexity of creating secure applications.

Here, we have seen some of the principles to consider regarding the security of the platforms and application development for the Cloud and cloud-native applications in general.

Finally, note that this is not an exhaustive list but is instead meant to serve as a stepping stone to more secure application development.


---
[1]: {{ site.url }}/cloud-security-principles/
[2]: https://linktr.ee/nehasardana
[3]: https://www.cisa.gov/sbom
[4]: https://www.verizon.com/business/resources/T39a/reports/dbir/2022-data-breach-investigations-report-dbir.pdf
