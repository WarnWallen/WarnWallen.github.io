---
layout: post
title: "Transformer模型研究笔记"
date: 2024-05-20
categories: [NLP, 深度学习]
tags: [Transformer, Attention]
math: true
---

## 核心架构

Transformer模型由Vaswani等人在2017年提出...

### 注意力机制公式

$$
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V
$$

## 模型优势

1. 并行计算效率高
2. 长距离依赖处理能力强

![Transformer架构图](/assets/images/transformer.png)