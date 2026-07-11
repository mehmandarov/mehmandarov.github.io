---
title: My Talks
layout: page
description: "I speak at conferences, meetups, and universities about cloud, architecture, AI, security, and Java – from keynotes to hands-on workshops."
eyebrow: "Public speaker since 2013"
hero_aside: talks-flags.html
pre_content: talks-stats.html
cta:
  - label: "Invite me to speak"
    url: "https://rustam.no/contact"
    icon: "arrow-right"
    style: primary
    external: true
  - label: "See the map"
    url: "#visited-map"
    style: ghost
---

{% include visited-map.html %}

## Countries

{% assign country_list = site.data.visited.country_names | sort %}
{{ country_list | join: ", " }}.

## Cities

{% assign city_list = site.data.visited.cities | map: "name" %}
{{ city_list | join: ", " }}.
