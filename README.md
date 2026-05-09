<<<<<<< HEAD
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
=======
# 🌏 AI Travel Content Generator

> 基于多 Agent 协作架构的智能旅游营销内容生成平台

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-MVP-orange?style=flat-square)]()

---

## 📌 项目背景

旅游平台需要持续产出大量内容——目的地攻略、酒店描述、行程推荐、社媒种草文案等。传统方式依赖编辑人工撰写，单个目的地页面内容更新周期长，且不同平台（官网详情页 / 小红书 / 抖音脚本）需要重复改写，人力成本极高。

本项目旨在通过 **多 Agent 协作 + 大模型长链推理**，实现旅游内容的自动化、批量化、多平台适配生成。

---

## 🚀 核心功能

| 功能模块 | 描述 |
|---|---|
| 🗺️ 目的地智能解析 | 输入目的地名称，自动提炼气候、文化、景点等核心标签 |
| 👤 用户画像匹配 | 支持亲子游 / 情侣游 / 背包客等多种人群风格适配 |
| ✍️ 多格式内容生成 | 一键输出官网文案、小红书种草帖、短视频脚本三套内容 |
| 🔍 SEO 优化检测 | 关键词布局分析 + 标题吸引力评分 + 自动优化建议 |
| 👁️ 实时预览 | 可视化编辑界面，支持多平台排版效果实时对比 |

---

## 🧠 Agent 架构设计

```
用户输入（目的地 + 受众 + 平台）
        │
        ▼
┌─────────────────────┐
│  目的地解析 Agent    │  ── 结构化目的地信息、提炼差异化卖点
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  用户画像匹配 Agent  │  ── 动态调整内容侧重点与语言风格
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  内容生成 Agent      │  ── 长链推理：分析竞品 → 提炼USP → 生成多版本文案
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  SEO优化 Agent       │  ── 合规检测 + 关键词密度 + 迭代优化
└─────────────────────┘
        │
        ▼
   多平台内容输出
```

---

## 🛠️ 技术栈

- **前端**：React 18 + Vite + TailwindCSS
- **AI 调用**：Anthropic Claude API / OpenAI API
- **状态管理**：Zustand
- **内容预览**：自定义多平台渲染组件

---

## 📁 项目结构

```
ai-travel-content-generator/
├── src/
│   ├── agents/              # 各 Agent 逻辑模块
│   │   ├── destinationAgent.js
│   │   ├── audienceAgent.js
│   │   ├── contentAgent.js
│   │   └── seoAgent.js
│   ├── components/          # UI 组件
│   │   ├── InputPanel/
│   │   ├── PreviewPanel/
│   │   └── OutputPanel/
│   ├── hooks/               # 自定义 Hooks
│   └── utils/               # 工具函数
├── public/
├── README.md
└── package.json
```

---

## ⚡ 快速开始

```bash
# 克隆项目
git clone https://github.com/your-username/ai-travel-content-generator.git

# 安装依赖
cd ai-travel-content-generator
npm install

# 配置环境变量
cp .env.example .env
# 填入你的 API Key: VITE_ANTHROPIC_API_KEY=your_key_here

# 启动开发服务器
npm run dev
```

---

## 🗺️ Roadmap

- [x] MVP：单目的地文案生成闭环
- [x] 多平台格式适配（官网 / 小红书 / 抖音）
- [ ] RAG 知识库接入（品牌风格记忆）
- [ ] 批量目的地内容生成
- [ ] 爆款内容对标学习模块
- [ ] 用户自定义 Agent 工作流配置

---

## 📄 License

MIT © 2025

---

> 💡 **申请说明**：本项目正处于 MVP 迭代阶段，申请 Token 额度主要用于多 Agent 并发场景的功能压测与产品优化迭代。
>>>>>>> dffc42ead907449855cf06a8f5a8ec9b5e9c633e
