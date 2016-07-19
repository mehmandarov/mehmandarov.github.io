---
title: "Posting Jekyll Content on Time"
layout: post
date: 2016-06-12 11:04 +0200
description: Posting of content in Jekyll relies on the date assigned to the post, and the time is relative to the time zone on the server. It can sometimes be confusing when running Jekyll on the remote servers in different time zones, like hosting the content on GitHub Pages.
tag:
- note to self
- jekyll
- english
blog: true
star: false
author: rustam.mehmandarov
---

_Posting of content in Jekyll relies on the date assigned to the post, and the time is relative to the time zone on the server. While this works fine for local installations of Jekyll, it can sometimes be confusing when running Jekyll on the remote servers without being able to control the time zone on that server, like hosting the content on GitHub Pages._


- [What's going on?](#whats-going-on)
- [Setting the date in the front matter](#setting-the-date-in-the-front-matter)
- [Setting the time zone in the Jekyll configuration file](#setting-the-time-zone-in-the-jekyll-configuration-file)

---

## What's going on?

So, you have written a brand new post. You have run tests on a local [Jekyll][4] server and everything looks great. You finally commit the changes to your GitHub site repository, and push the changes to the server. You are excited and full of anticipation to see your new blog post online, you hit refresh in your browser, and... nothing. Another refresh – still nothing.

One of the reasons for this is that you have specified a date/time for your post in the [YAML front matter][1] in the header. 

By setting date in the front matter you can override the date/time assigned to the post in the format ```YYYY-MM-DD HH:MM:SS```. However, this notation will use the local time zone, set by your operating system. This works fine when running a local installation of Jekyll. However, if your Jekyll installation is running on a remote server (e.g. on the GitHub Pages server) the time on that server is likely not to be the same as the time on your local machine. Jekyll will then wait before processing the contents of the post until the specified time hits the clock on the server.

For your post to be processed according to your time zone, you can either add a UTC offset for your time zone for the post in question, or you can specify a time zone in the Jekyll configuration file.


## Setting the date in the front matter

To specify the UTC offset for each post use the following format: ```YYYY-MM-DD HH:MM:SS +/-TTTT```, e.g. ```2016-06-12 11:04:00 +0200```. This might be useful if you want specify the offset for some specific posts.

{% highlight yaml %}
---
title: "Your title"
layout: post
date: 2016-06-12 11:04 +0200
---
Your content.
{% endhighlight %}


## Setting the time zone in the Jekyll configuration file

If you want an offset to be applied to all of the dates on your site, you might want to configure Jekyll by setting the time zone for site generation in ```_config.yml```.

Any entry from the [IANA Time Zone Database][2] is a valid value, e.g. ```Europe/Oslo```. Wikipedia also has a list of [all available values][3]. 

{% highlight yaml %}
# set timezone
timezone: Europe/Oslo
{% endhighlight %}

If not specified, Jekyll will use the local time zone, as set by your operating system.



[1]: https://jekyllrb.com/docs/frontmatter/
[2]: https://en.wikipedia.org/wiki/Tz_database
[3]: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
[4]: https://jekyllrb.com/