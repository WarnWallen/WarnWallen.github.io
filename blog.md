---
layout: page
title: 所有笔记
permalink: /blog/
---

<h1>学术笔记列表</h1>

{% for post in site.posts %}
  <div class="post-preview">
    <h2><a href="{{ post.url }}">{{ post.title }}</a></h2>
    <p>{{ post.date | date: "%Y年%m月%d日" }}</p>
    <div>{{ post.excerpt }}</div>
  </div>
  <hr>
{% endfor %}