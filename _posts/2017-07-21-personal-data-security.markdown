---
title: "Personal Data Security"
layout: post
date: 2017-07-21 10:23 +0200
image: '/assets/images/posts-images/caution_keyboard_small.jpeg'
description:
tag:
- security
- data privacy
- GDPR
- english
category: blog
star: false
author: rustam.mehmandarov
---

_Are you sure you are not leaking sensitive data? Or how one of the Norway's biggest Apple Premium Resellers and service centers was leaking data to anyone who would bother to click a button._

- [The Story](#the-story)
- [Information Security](#information-security)
- [Norwegian Personal Data Act (Personopplysningsloven)](#norwegian-personal-data-act-personopplysningsloven)
- [EU GDPR](#eu-gdpr)
- [The Bottom Line](#the-bottom-line)

---

## The Story
It all started when I had to deliver my Apple device for service due to some hardware issues to one of the biggest Apple Premium Resellers and service centers in Norway. After handing in the product, I got an SMS and an email containing a link to a website where I could track the progress of the service online. So far, so good.

While logging in I realized that I already had an account, but did not have the password, so I decided to reset that – that's where it all started.

The first thing I did, was to push the big, blue "Forgot My Password" button. Unsure if I had to type in the email first, or if I would be forwarded to another page, where I would have to provide my account details to process with the password reset procedure, I just clicked the button.

<figcaption class = "caption">Resetting password</figcaption>
![Resetting password][1]

However, instead of being redirected to a new page, or getting an error about the missing e-mail in the form, I was presented with this page. Are you noticing anything strange?

<figcaption class = "caption">Your password has been reset</figcaption>
![Your password has been reset][2]

Well, yes, the site reset the password and sent it over to an email and as an SMS. Cool! The only problem was that at that point it could not have any idea who I was, since I have not provided any information about myself yet, and there were no cookies to identify myself to that site. 

Another problem there was that the phone number is shown in clear text (hidden here) was not mine. So, I just reset the password and sent it over to some random user – possibly the first, or the last one in the users table. I tried a few times just to make sure that it was not my fault, and I was still resetting the password for the same person _(sorry, total stranger!)_.

Having worked with systems development for quite some time, I shrug my shoulders, slightly shook my head, mumbled something about weird bugs and reset my password. This time by providing my e-mail address, proceeding to check the status of my device.

Then, it suddenly hit me. By only providing an email to a service, I could see a confirmation about my password is sent to _my mobile phone number_ registered in the system – _in clear text_!

While the first bug (resetting the password for a random person) might be just annoying to a small group of users, the second one (dumping the phone numbers from the database in clear text) was much worse for a bigger group of people. Why might you ask?

## Information Security
Well, given the fact that the company is being one of the biggest service centers for Apple products, it is very likely to assume that many people would have owned, and sent in for a service an Apple device at some point in the past; thereby getting registered in the service provider's database. 

So, now I was sitting in front of an unintentional yellow pages (a.k.a. phone directory) service that could provide me with phone numbers of nearly anyone I wanted by just manually typing their emails, or by creating a script that would try scrape the Internet, or just simply construct emails by putting together `firstname.lastname` and some `@provider.com`, and dumping all the phone numbers from their customer database. 

Well, of course, bugs happen, so I don't want to jump into conclusions about the lack of proper testing or similar in general. 

However, when we provide data to a company, we expect them to handle it with integrity and care, and not leak personal data to the outside world. While phone number might be considered a low-risk data to be leaked for most of us, it might still be quite sensitive for some groups of people, like some high-profile politicians, celebrities, or anybody else how might have a wish, or even a need, to hide their contact information.

## Norwegian Personal Data Act (Personopplysningsloven)
Also, according to The Norwegian Data Protection Authority (Datatilsynet), any information that can be used to identify a person is [considered personal][3]{:target="_blank"}. Further, [Personal Data Act][5]{:target="_blank"} chapter 2, section 13 _(Norwegian: [Personopplysningsloven][4]{:target="_blank"})_ requires that _"the processor shall by means of planned, systematic measures ensure satisfactory data security with regard to confidentiality, integrity, and accessibility in connection with the processing of personal data"_.

Further, according to the Personal Data Act section 46, The Norwegian Data Protection Authority (Datatilsynet) may impose a fee for violations of the act, or the regulations, with an amount up to ten times the [basic amount][7]{:target="_blank"} of the National Insurance, equivalent to 925,760 NOK (as of May 2017).

## EU GDPR
If the fines mentioned above sound bad, just wait to see how expensive it will get with the introduction of EU General Data Protection Regulation (GDPR) next year.

With the introduction of [GDPR][6]{:target="_blank"} in 2018, the maximum amount of fines will be raised significantly with an upper limit of 20 million NOK, or the company's 4% of the total global annual turnover in the previous fiscal year, if this is higher (GDPR art. 83, item 5).

## The Bottom Line
Storing any personal information is an important task and requires rigorous testing and planning on what data you collect, why and how it is protected. Deviating from that can be rather harmful to your company both in regard to reputation and the financial penalties.

That all being said, it is important to note that all of the problems I reported to the company in question were fixed within a few hours. However, I don't know for how long that data was available online, and if anyone had taken advantage of the vulnerability of the system.

Least but not last, I would like to thank the company, and especially the company's CIO for great communication and quick responses and fast bug fixes.

---

[1]:{{ site.url }}/assets/images/posts-images/2017-07-21_reset_password_1.png
[2]:{{ site.url }}/assets/images/posts-images/2017-07-21_reset_password_2.png
[3]:https://www.datatilsynet.no/om-personvern/personopplysninger/
[4]:https://lovdata.no/dokument/NL/lov/2000-04-14-31
[5]:https://www.datatilsynet.no/en/regulations-and-tools/regulations-and-decisions/norwegian-privacy-law/personal-data-act/
[6]:http://www.eugdpr.org/
[7]:http://www.skatteetaten.no/en/Rates/National-Insurance-scheme-basic-amount/
