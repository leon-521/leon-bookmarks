# 📑 Leon Bookmarks

> 多租户书签导航系统 — Multi-tenant Bookmark Navigation System

A modern, beautiful bookmark navigation platform that allows organizations and individuals to create their own customizable navigation sites.

## ✨ Features

- **Multi-Tenant Architecture** — Each tenant gets their own isolated workspace with custom subdomain
- **Smart Bookmarks** — Auto-fetch metadata (title, description, favicon, OG image) from URLs
- **Custom Themes** — 6 preset themes + fully customizable colors, layouts, and typography
- **Multiple Layouts** — Card grid, compact list, or sidebar navigation views
- **Team Collaboration** — Invite members with role-based access (Admin / Editor / Viewer)
- **Full-Text Search** — Instant, typo-tolerant search powered by Meilisearch
- **Import/Export** — Bulk import from Chrome/Firefox HTML or JSON, and export to HTML, JSON, or CSV
- **AI Intelligence Suite** — Dual-engine (OpenAI-compatible LLM + zero-config heuristic fallback) for auto-categorization, smart tagging, URL summarization, conversational workspace Q&A (RAG), AI taxonomy architect, dead-link health checks with Wayback Machine snapshots, and duplicate cleanup
- **Super Admin & SaaS Billing** — Platform-wide tenant/user management console + Stripe Checkout, Customer Portal & Webhook integration (with local mock fallback)
- **Browser Extension (Manifest V3)** — One-click Chrome/Edge extension with AI Smart Fill and right-click context menu saving
- **Responsive Design & Dark Mode** — Beautiful across desktop, tablet, and mobile with system-aware dark mode

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| UI | Radix UI + Tailwind CSS |
| State | Zustand + React Query |
| Backend | Nest.js, Node.js, TypeScript |
| Database | PostgreSQL 16 (with RLS) |
| ORM | Prisma |
| Cache | Redis 7 |
| Search | Meilisearch |
| Storage | S3 / MinIO |
| Auth | JWT + OAuth |

## 📁 Project Structure

```
leon-bookmarks/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # Nest.js backend API
├── packages/
│   ├── shared/       # Shared types, constants, validators
│   └── ui/           # Shared UI component library
├── browser-extension/ # Chrome/Edge extension
├── docker/           # Docker Compose & configs
└── docs/             # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### 1. Clone & Install

```bash
git clone https://github.com/leon-521/leon-bookmarks.git
cd leon-bookmarks
pnpm install
```

### 2. Start Infrastructure

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 3. Setup Database

```bash
cp apps/api/.env.example apps/api/.env
pnpm db:migrate
pnpm db:seed
```

### 4. Start Development

```bash
pnpm dev
```

This starts:
- 🌐 **Frontend**: http://localhost:3000
- 🔌 **API**: http://localhost:4000
- 📖 **API Docs**: http://localhost:4000/api/docs

## 📝 Environment Variables

See `apps/api/.env.example` for all required environment variables (including optional Stripe and OpenAI-compatible AI settings).

## 🗺️ Roadmap

- [x] Phase 1 — MVP: Multi-tenant Auth, Bookmarks CRUD, Categories, Public Navigation Portal
- [x] Phase 2 — Enhancement: Themes, Drag-and-Drop Sorting, HTML/JSON/CSV Import & Export, Dark Mode, Team Members RBAC
- [x] Phase 3 — Commercial: Super Admin Console, Plans & Stripe Billing, Browser Extension (MV3)
- [x] Phase 4 — AI Native: Auto-Categorize & Tagging, Conversational Copilot Q&A, Taxonomy Architect, Link Health & Deduplication

## 📄 License

MIT
