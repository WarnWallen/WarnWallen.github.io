# 文件名：posts.md
# 位置：项目根目录（与 _config.yml 同级）

---
layout: page
title: 所有笔记
permalink: /posts/  # 设置访问路径为 /posts/
---

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <small>({{ post.date | date: "%Y-%m-%d" }})</small>
    </li>
  {% endfor %}
</ul>