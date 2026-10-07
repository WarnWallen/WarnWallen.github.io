---
layout: page
title: 《蒙古秘史》合璧本
permalink: /mishi/
---

<p>明初翰译院《元朝秘史》汉字音写本，正文十二卷（卷一至卷十、续卷一、续卷二），凡二百八十二节。各卷之下分节，节文今先录总译。</p>

{%- assign vols = site.mishi | where: "layout", "mishi_volume" | sort: "order" -%}
<ul class="mishi-vols">
  {%- for v in vols -%}
  {%- assign secs = site.mishi | where: "layout", "mishi_section" | where: "volume", v.volume | sort: "section" -%}
  {%- assign first_sec = secs | first -%}
  {%- assign last_sec = secs | last -%}
  <li>
    <a class="mishi-vol-link" href="{{ v.url | relative_url }}">
      <strong>{{ v.title }}</strong>
      <span class="mishi-vol-range">{% if secs.size > 0 %}§{{ first_sec.section }}–§{{ last_sec.section }} · {{ secs.size }} 节{% else %}待补{% endif %}</span>
    </a>
  </li>
  {%- endfor -%}
</ul>

<style>
.mishi-vols{list-style:none;padding:0;margin:1.5rem 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.8rem}
.mishi-vols li{margin:0}
.mishi-vol-link{display:block;padding:.7rem 1rem;border:1px solid rgba(128,128,128,.4);border-radius:6px;text-decoration:none}
.mishi-vol-link:hover{border-color:currentColor}
.mishi-vol-link strong{display:block}
.mishi-vol-range{font-size:.85em;opacity:.7}
</style>
