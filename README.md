<p align="center">
  <h1 align="center">📑 Leon Bookmarks</h1>
  <p align="center">
    多租户书签导航系统 — Multi-tenant Bookmark Navigation System
  </p>
  <p align="center">
    <a href="#-快速开始-quick-start">快速开始</a> ·
    <a href="#-docker-compose-部署-deployment">Docker 部署</a> ·
    <a href="#-功能特性-features">功能特性</a> ·
    <a href="#-技术栈-tech-stack">技术栈</a> ·
    <a href="#-浏览器扩展-browser-extension">浏览器扩展</a>
  </p>
</p>

---

> **中文** | **English** — 本文档同时提供中文和英文内容。  
> This document is provided in both Chinese and English.

---

## ✨ 功能特性 / Features

| 功能 Feature | 说明 Description |
|---|---|
| **多租户架构** Multi-Tenant | 每个租户拥有独立的工作空间和自定义子域名 / Each tenant gets an isolated workspace with custom subdomain |
| **智能书签** Smart Bookmarks | 自动抓取 URL 元数据（标题、描述、favicon、OG 图片）/ Auto-fetch metadata from URLs |
| **自定义主题** Custom Themes | 6 种预设主题 + 完全自定义颜色、布局和字体 / 6 presets + fully customizable colors, layouts & typography |
| **多种布局** Multiple Layouts | 卡片网格、紧凑列表或侧边栏导航视图 / Card grid, compact list, or sidebar views |
| **团队协作** Team Collaboration | 基于角色的访问控制（管理员/编辑者/查看者）/ Role-based access (Admin / Editor / Viewer) |
| **全文搜索** Full-Text Search | 由 Meilisearch 驱动的即时、容错搜索 / Instant, typo-tolerant search powered by Meilisearch |
| **导入/导出** Import/Export | 从 Chrome/Firefox HTML 或 JSON 批量导入，导出为 HTML、JSON 或 CSV / Bulk import & export |
| **AI 智能套件** AI Suite | 自动分类、智能标签、URL 摘要、对话式 Q&A (RAG)、AI 分类架构师、死链检测、去重。**支持在超级管理后台自定义添加 AI 供应商**（OpenAI、DeepSeek、Moonshot、智谱、硅基流动、Ollama 等任何 OpenAI 兼容接口）/ Auto-categorization, smart tagging, URL summarization, conversational Q&A, dead-link health checks, duplicate cleanup. **Custom AI providers configurable via Super Admin dashboard** (OpenAI, DeepSeek, Moonshot, Zhipu, Silicon Flow, Ollama, or any OpenAI-compatible API) |
| **超级管理员 & SaaS 计费** Super Admin & Billing | 平台级租户/用户管理 + Stripe Checkout 集成（带本地 Mock 回退）/ Platform-wide management + Stripe integration (with local mock fallback) |
| **浏览器扩展** Browser Extension | Chrome/Edge Manifest V3 扩展，一键保存 + AI 智能填充 + 右键菜单 / One-click save + AI Smart Fill + context menu |
| **响应式设计 & 暗色模式** Responsive & Dark Mode | 桌面、平板和移动端自适应，支持系统级暗色模式 / Beautiful across all devices with system-aware dark mode |

---

## 🏗️ 技术栈 / Tech Stack

| 层级 Layer | 技术 Technology |
|---|---|
| 前端 Frontend | Next.js 14 (App Router), React 18, TypeScript |
| UI 组件 | Radix UI + Tailwind CSS |
| 状态管理 State | Zustand + React Query (TanStack Query) |
| 后端 Backend | Nest.js, Node.js, TypeScript |
| 数据库 Database | PostgreSQL 16 (with RLS) |
| ORM | Prisma |
| 缓存 Cache | Redis 7 |
| 搜索引擎 Search | Meilisearch |
| 对象存储 Storage | S3 / MinIO |
| 认证 Auth | JWT + OAuth |
| 构建工具 Build | Turborepo + pnpm |
| CI/CD | GitHub Actions |
| 容器化 Container | Docker + Docker Compose |

---

## 📁 项目结构 / Project Structure

```
leon-bookmarks/
├── apps/
│   ├── api/                    # Nest.js 后端 API / Backend API
│   │   ├── prisma/             #   Prisma schema & seed / 数据库模型和种子数据
│   │   ├── src/
│   │   │   ├── common/         #   过滤器、拦截器、中间件 / Filters, interceptors, middleware
│   │   │   ├── modules/
│   │   │   │   ├── admin/      #   超级管理员 / Super admin
│   │   │   │   ├── ai/         #   AI 智能功能 / AI intelligence
│   │   │   │   ├── auth/       #   认证（JWT）/ Authentication (JWT)
│   │   │   │   ├── billing/    #   Stripe 计费 / Stripe billing
│   │   │   │   ├── bookmark/   #   书签 CRUD / Bookmark CRUD
│   │   │   │   ├── category/   #   分类管理 / Category management
│   │   │   │   ├── import/     #   批量导入 / Bulk import
│   │   │   │   ├── meta-scraper/ # 元数据抓取 / Metadata scraping
│   │   │   │   ├── portal/     #   公开导航页 / Public portal
│   │   │   │   └── tenant/     #   租户管理 / Tenant management
│   │   │   └── prisma/         #   Prisma 服务 / Prisma service
│   │   └── Dockerfile
│   └── web/                    # Next.js 前端 / Frontend
│       ├── src/
│       │   ├── app/            #   App Router 页面 / App Router pages
│       │   ├── components/     #   React 组件 / React components
│       │   ├── hooks/          #   自定义 Hooks / Custom hooks
│       │   ├── lib/            #   工具和服务 / Utils & services
│       │   └── providers/      #   上下文提供者 / Context providers
│       └── Dockerfile
├── browser-extension/          # Chrome/Edge 浏览器扩展 / Browser extension (MV3)
├── docker/                     # 基础设施 Docker Compose / Infrastructure compose
│   ├── docker-compose.yml      #   仅基础设施服务 / Infrastructure services only
│   └── init-db.sql             #   数据库初始化 / DB initialization
├── docker-compose.yml          # 🐳 全栈部署 / Full-stack deployment
├── docker-compose.1panel.yml   # 🚀 1Panel 单文件编排 / 1Panel standalone compose
├── .env.docker.example         # Docker 环境变量模板 / Docker env template
├── turbo.json                  # Turborepo 配置 / Turborepo config
├── pnpm-workspace.yaml         # pnpm 工作区 / pnpm workspace
└── package.json
```

---

## 🚀 快速开始 / Quick Start

### 环境要求 / Prerequisites

| 工具 Tool | 版本 Version | 用途 Purpose |
|---|---|---|
| Node.js | 20+ | 运行时 / Runtime |
| pnpm | 9+ | 包管理器 / Package manager |
| Docker | 20+ | 容器化 / Containerization |
| Docker Compose | V2 | 服务编排 / Service orchestration |

---

### 方式一：本地开发 / Option 1: Local Development

<details>
<summary><b>📖 展开查看 / Click to expand</b></summary>

#### 1. 克隆和安装 / Clone & Install

```bash
git clone https://github.com/leon-521/leon-bookmarks.git
cd leon-bookmarks
pnpm install
```

#### 2. 启动基础设施 / Start Infrastructure

```bash
docker compose -f docker/docker-compose.yml up -d
```

这将启动 PostgreSQL、Redis、Meilisearch 和 MinIO。  
This starts PostgreSQL, Redis, Meilisearch, and MinIO.

#### 3. 配置数据库 / Setup Database

```bash
cp apps/api/.env.example apps/api/.env
# 编辑 .env 文件配置你的设置 / Edit .env to configure your settings

pnpm db:migrate    # 运行数据库迁移 / Run database migrations
pnpm db:seed       # 填充示例数据 / Seed demo data
```

#### 4. 启动开发服务器 / Start Dev Server

```bash
pnpm dev
```

启动后可访问 / Access after startup:

| 服务 Service | 地址 URL |
|---|---|
| 🌐 前端 Frontend | http://localhost:3000 |
| 🔌 后端 API | http://localhost:4000 |
| 📖 API 文档 Swagger | http://localhost:4000/api/docs |
| 🔍 Meilisearch | http://localhost:7700 |
| 📦 MinIO Console | http://localhost:9001 |

</details>

---

### 方式二：Docker Compose 一键部署 / Option 2: Docker Compose Deployment

> **推荐用于生产或快速体验** / **Recommended for production or quick preview**

#### 1. 克隆仓库 / Clone Repository

```bash
git clone https://github.com/leon-521/leon-bookmarks.git
cd leon-bookmarks
```

#### 2. 配置环境变量 / Configure Environment

```bash
cp .env.docker.example .env.docker
```

编辑 `.env.docker` 文件，**生产环境务必修改以下配置** / Edit `.env.docker`, **change these for production**:

```bash
# ⚠️ 生产环境必须修改 / MUST change for production
POSTGRES_PASSWORD=your-strong-password
JWT_SECRET=your-random-secret-at-least-32-chars
MEILI_MASTER_KEY=your-meili-master-key

# 可选：Stripe 在线支付 / Optional: Stripe payments
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# AI 供应商在超级管理后台配置 / AI providers are configured in Super Admin dashboard
```

#### 3. 构建并启动 / Build & Start

```bash
# 一键启动所有服务 / Start all services
docker compose --env-file .env.docker up -d --build
```

#### 4. 初始化数据库 / Initialize Database

```bash
# 运行数据库迁移 / Run migrations
docker compose exec api npx prisma db push

# （可选）填充示例数据 / (Optional) Seed demo data
docker compose exec api npx prisma db seed
```

#### 5. 访问应用 / Access Application

| 服务 Service | 地址 URL | 说明 Description |
|---|---|---|
| 🌐 前端 Frontend | http://localhost:3000 | 主应用 / Main application |
| 🔌 后端 API | http://localhost:4000 | REST API |
| 📖 API 文档 Swagger | http://localhost:4000/api/docs | 交互式 API 文档 / Interactive API docs |
| 🔍 Meilisearch | http://localhost:7700 | 搜索引擎控制台 / Search engine console |
| 📦 MinIO Console | http://localhost:9001 | 对象存储控制台 / Object storage console |

---

### 方式三：1Panel 面板部署 / Option 3: 1Panel Deployment

> **适用于使用 [1Panel](https://1panel.cn/) 面板管理服务器的用户** / **For users managing servers with 1Panel**

通过 1Panel 的「容器编排」功能可视化部署，支持：

- ✅ 在 1Panel 面板中创建 Docker Compose 编排
- ✅ 一键构建和启动所有服务
- ✅ 通过 1Panel 网站管理配置域名 + HTTPS + 反向代理
- ✅ 复用 1Panel 已安装的 PostgreSQL / Redis
- ✅ 在 1Panel 中查看容器日志和状态

📖 **详细教程请查看：[1Panel 部署指南](docs/1panel-deploy.md)**

快速预览步骤：

1. **创建编排** — 1Panel → 容器 → 编排 → 创建编排（名称：`leon-bookmarks`）
2. **粘贴配置** — 将 [1Panel 部署指南](docs/1panel-deploy.md) 中的 Docker Compose 配置粘贴进去
3. **修改密码** — 修改 PostgreSQL、JWT、Meilisearch、MinIO 的密码
4. **确认创建** — 等待构建完成（约 5-10 分钟）
5. **初始化 DB** — 在 `lb-api` 容器终端执行 `npx prisma db push`
6. **配置域名** — （可选）通过 1Panel 网站管理创建反向代理 + HTTPS

---

### 🧑‍💻 演示账号 / Demo Accounts

种子数据创建后可用 / Available after seeding:

| 邮箱 Email | 密码 Password | 租户 Tenant | 角色 Role |
|---|---|---|---|
| `leon@bookmarks.dev` | `password123` | Acme Dev Team | Admin |
| `alice@bookmarks.dev` | `password123` | Acme Dev Team | Editor |
| `designer@creative.dev` | `password123` | Creative Studio | Admin |

---

## 🐳 Docker 命令参考 / Docker Commands Reference

```bash
# 启动所有服务 / Start all services
docker compose --env-file .env.docker up -d --build

# 查看服务状态 / Check service status
docker compose ps

# 查看日志 / View logs
docker compose logs -f              # 所有服务 / All services
docker compose logs -f api          # 仅 API / API only
docker compose logs -f web          # 仅前端 / Web only

# 停止所有服务 / Stop all services
docker compose down

# 停止并删除数据卷（⚠️ 会丢失所有数据）/ Stop and remove volumes (⚠️ data loss)
docker compose down -v

# 重新构建单个服务 / Rebuild a single service
docker compose up -d --build api
docker compose up -d --build web

# 进入容器 Shell / Enter container shell
docker compose exec api sh
docker compose exec postgres psql -U postgres -d leon_bookmarks

# 数据库操作 / Database operations
docker compose exec api npx prisma db push   # 运行迁移 / Run migrations
docker compose exec api npx prisma db seed           # 填充数据 / Seed data
docker compose exec api npx prisma studio            # 可视化管理 / Visual DB manager
```

---

## 📊 架构概览 / Architecture Overview

```
                              ┌─────────────────────────┐
                              │    Browser Extension    │
                              │   (Chrome / Edge MV3)   │
                              └────────────┬────────────┘
                                           │
                    ┌──────────────────────┐│┌──────────────────────┐
                    │                      │││                      │
                    │   Next.js Frontend   │││   Public Portal      │
                    │   (localhost:3000)    ├┤│   (/portal/:slug)    │
                    │                      │││                      │
                    └──────────┬───────────┘│└──────────┬───────────┘
                               │            │           │
                               └────────────┼───────────┘
                                            │
                               ┌────────────▼───────────┐
                               │                        │
                               │   Nest.js API Server   │
                               │   (localhost:4000)      │
                               │                        │
                               └───┬───┬───┬───┬────────┘
                                   │   │   │   │
                    ┌──────────────┘   │   │   └──────────────┐
                    │                  │   │                   │
              ┌─────▼─────┐    ┌──────▼───▼──┐         ┌─────▼─────┐
              │PostgreSQL │    │   Redis     │         │Meilisearch│
              │  16       │    │   7         │         │  v1.6     │
              │ (5432)    │    │  (6379)     │         │ (7700)    │
              └───────────┘    └─────────────┘         └───────────┘
                                                             │
                                                       ┌─────▼─────┐
                                                       │  MinIO    │
                                                       │  S3      │
                                                       │(9000/9001)│
                                                       └───────────┘
```

> **💡 AI 供应商管理 / AI Provider Management**: AI 配置不再需要环境变量，所有 AI 供应商（OpenAI、DeepSeek、Moonshot、Ollama 等）均可在超级管理后台动态添加、测试和切换。/ AI configuration no longer requires environment variables. All AI providers can be dynamically added, tested, and switched in the Super Admin dashboard.

---

## 🔧 环境变量 / Environment Variables

### API 后端 / Backend

| 变量 Variable | 说明 Description | 默认值 Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接串 / Connection string | `postgresql://postgres:postgres@localhost:5432/leon_bookmarks` |
| `JWT_SECRET` | JWT 密钥 / JWT signing secret | — (必填 required) |
| `JWT_EXPIRATION` | 访问令牌有效期 / Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRATION` | 刷新令牌有效期 / Refresh token TTL | `7d` |
| `FRONTEND_URL` | 前端地址（CORS）/ Frontend URL for CORS | `http://localhost:3000` |
| `PORT` | API 端口 / API port | `4000` |
| `STRIPE_SECRET_KEY` | Stripe 密钥（可选）/ Stripe key (optional) | — (留空使用 Mock / empty for mock mode) |
| — | AI 供应商配置已移至超级管理后台 / AI provider config is now managed in Super Admin → AI Providers | — |

### Web 前端 / Frontend

| 变量 Variable | 说明 Description | 默认值 Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 / Backend API URL | `http://localhost:4000` |

---

## 🌐 浏览器扩展 / Browser Extension

Chrome / Edge Manifest V3 浏览器扩展，支持以下功能 / Features:

- **一键保存** One-Click Save — 保存当前页面为书签 / Save current page as bookmark
- **AI 智能填充** AI Smart Fill — 自动填充书签标题和描述 / Auto-fill title and description
- **右键菜单** Context Menu — 在任意链接上右键保存 / Right-click on any link to save

### 安装方式 / Installation

1. 打开 `chrome://extensions/` / Open `chrome://extensions/`
2. 开启「开发者模式」/ Enable "Developer mode"
3. 点击「加载已解压的扩展程序」/ Click "Load unpacked"
4. 选择 `browser-extension/` 目录 / Select the `browser-extension/` directory

---

## 🗄️ 数据库模型 / Database Schema

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Tenant  │────<│   User   │     │ Category │────<│ Category │
│          │     │          │     │  (tree)  │     │ (child)  │
│ • name   │     │ • email  │     │          │     │          │
│ • slug   │     │ • role   │     │ • name   │     │          │
│ • plan   │     │ • name   │     │ • icon   │     │          │
│ • theme  │     └────┬─────┘     └────┬─────┘     └──────────┘
└────┬─────┘          │                │
     │                │                │
     └───────────────>│<───────────────┘
                 ┌────▼─────┐
                 │ Bookmark │
                 │          │
                 │ • title  │
                 │ • url    │
                 │ • tags[] │
                 │ • status │
                 └──────────┘
```

**角色 / Roles**: `SUPER_ADMIN` · `ADMIN` · `EDITOR` · `VIEWER`  
**套餐 / Plans**: `FREE` · `PRO` · `ENTERPRISE`  
**书签状态 / Bookmark Status**: `ACTIVE` · `BROKEN` · `ARCHIVED`

---

## 🛠️ 开发指南 / Development Guide

### 常用命令 / Common Commands

```bash
pnpm dev              # 启动开发服务器 / Start dev server
pnpm build            # 构建所有包 / Build all packages
pnpm lint             # 代码检查 / Lint all code

pnpm db:migrate       # 运行数据库迁移 / Run database migrations
pnpm db:generate      # 生成 Prisma Client / Generate Prisma Client
pnpm db:seed          # 填充种子数据 / Seed demo data
```

### API 文档 / API Documentation

后端自带 Swagger UI，访问 `http://localhost:4000/api/docs` 可查看所有 API 接口。  
The backend includes Swagger UI at `http://localhost:4000/api/docs` for interactive API exploration.

---

## 🗺️ 路线图 / Roadmap

- [x] **Phase 1 — MVP**: 多租户认证、书签 CRUD、分类管理、公开导航门户 / Multi-tenant Auth, Bookmarks CRUD, Categories, Public Portal
- [x] **Phase 2 — 增强 Enhancement**: 主题定制、拖拽排序、HTML/JSON/CSV 导入导出、暗色模式、团队成员 RBAC / Themes, Drag-and-Drop, Import/Export, Dark Mode, Team RBAC
- [x] **Phase 3 — 商业化 Commercial**: 超级管理后台、套餐 & Stripe 计费、浏览器扩展 (MV3) / Super Admin, Plans & Stripe Billing, Browser Extension
- [x] **Phase 4 — AI 原生 AI Native**: 自动分类 & 标签、对话式 Copilot Q&A、分类架构师、链接健康检查 & 去重 / Auto-Categorize & Tagging, Conversational Q&A, Taxonomy Architect, Link Health & Deduplication

---

## 🤝 贡献 / Contributing

欢迎提交 Issue 和 Pull Request！/ Issues and Pull Requests are welcome!

1. Fork 本仓库 / Fork this repository
2. 创建特性分支 / Create a feature branch: `git checkout -b feature/my-feature`
3. 提交更改 / Commit changes: `git commit -m 'feat: add my feature'`
4. 推送分支 / Push branch: `git push origin feature/my-feature`
5. 创建 Pull Request / Open a Pull Request

---

## 📄 许可证 / License

[MIT](LICENSE)
