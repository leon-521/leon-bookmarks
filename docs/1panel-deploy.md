# 📑 Leon Bookmarks — 1Panel 部署指南

> 通过 1Panel 面板的「容器编排」功能，一键部署 Leon Bookmarks 多租户书签导航系统。

---

## 📋 前提条件

| 项目 | 要求 |
|---|---|
| 服务器 | Linux (Ubuntu / Debian / CentOS) |
| 1Panel | v2.0+ 已安装并运行 |
| Docker | 1Panel 自带管理，确保 Docker 已启用 |
| 内存 | 建议 ≥ 2GB |
| 磁盘 | 建议 ≥ 10GB 可用空间 |

---

## 🚀 部署步骤

### 第一步：创建容器编排

1. 登录 1Panel 面板
2. 左侧菜单点击 **「容器」** → **「编排」**
3. 点击右上角 **「创建编排」** 按钮
4. 来源选择 **「编辑」**
5. 文件夹名称填写：`leon-bookmarks`

> 创建后的编排文件路径为：`{1Panel安装目录}/1panel/docker/compose/leon-bookmarks`

### 第二步：粘贴 Docker Compose 配置

将以下内容完整粘贴到编排编辑器中：

```yaml
services:
  # ═══════════════════════════════════════════
  # PostgreSQL 16 - 主数据库
  # ═══════════════════════════════════════════
  postgres:
    image: postgres:16-alpine
    container_name: lb-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: leon_bookmarks
      POSTGRES_USER: postgres
      # ⚠️ 生产环境请修改密码
      POSTGRES_PASSWORD: LeonBm2024!Secure
    ports:
      - "15432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - lb-network

  # ═══════════════════════════════════════════
  # Redis 7 - 缓存
  # ═══════════════════════════════════════════
  redis:
    image: redis:7-alpine
    container_name: lb-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    ports:
      - "16379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - lb-network

  # ═══════════════════════════════════════════
  # Meilisearch v1.6 - 全文搜索引擎
  # ═══════════════════════════════════════════
  meilisearch:
    image: getmeili/meilisearch:v1.6
    container_name: lb-meilisearch
    restart: unless-stopped
    environment:
      # ⚠️ 生产环境请修改 Master Key
      MEILI_MASTER_KEY: LeonMeili2024!Key
      MEILI_ENV: production
    ports:
      - "17700:7700"
    volumes:
      - meilidata:/meili_data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7700/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - lb-network

  # ═══════════════════════════════════════════
  # MinIO - S3 兼容对象存储
  # ═══════════════════════════════════════════
  minio:
    image: minio/minio:latest
    container_name: lb-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      # ⚠️ 生产环境请修改用户名和密码
      MINIO_ROOT_USER: leonminio
      MINIO_ROOT_PASSWORD: LeonMinio2024!Pass
    ports:
      - "19000:9000"
      - "19001:9001"
    volumes:
      - miniodata:/data
    networks:
      - lb-network

  # ═══════════════════════════════════════════
  # API - Nest.js 后端服务
  # ═══════════════════════════════════════════
  api:
    build:
      context: https://github.com/leon-521/leon-bookmarks.git#feat/bookmark-nav-v1
      dockerfile: apps/api/Dockerfile
    container_name: lb-api
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 4000
      DATABASE_URL: postgresql://postgres:LeonBm2024!Secure@postgres:5432/leon_bookmarks
      # ⚠️ 生产环境请修改 JWT 密钥（至少 32 位随机字符串）
      JWT_SECRET: LeonJwt2024SecretKeyChangeMe!1234
      JWT_EXPIRATION: 15m
      JWT_REFRESH_EXPIRATION: 7d
      FRONTEND_URL: http://localhost:3000
      REDIS_URL: redis://redis:6379
      MEILI_URL: http://meilisearch:7700
      MEILI_MASTER_KEY: LeonMeili2024!Key
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: leonminio
      MINIO_SECRET_KEY: LeonMinio2024!Pass
      # Stripe 和 AI 均在超级管理后台配置，无需环境变量
    ports:
      - "4000:4000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      meilisearch:
        condition: service_healthy
    networks:
      - lb-network

  # ═══════════════════════════════════════════
  # Web - Next.js 前端
  # ═══════════════════════════════════════════
  web:
    build:
      context: https://github.com/leon-521/leon-bookmarks.git#feat/bookmark-nav-v1
      dockerfile: apps/web/Dockerfile
    container_name: lb-web
    restart: unless-stopped
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: http://localhost:4000
      NEXT_TELEMETRY_DISABLED: 1
    ports:
      - "3000:3000"
    depends_on:
      - api
    networks:
      - lb-network

volumes:
  pgdata:
  redisdata:
  meilidata:
  miniodata:

networks:
  lb-network:
    driver: bridge
```

### 第三步：修改关键配置

在粘贴后，**必须修改以下配置项**（搜索 `⚠️` 标记的位置）：

| 配置项 | 位置 | 建议操作 |
|---|---|---|
| `POSTGRES_PASSWORD` | postgres 服务 | 改为强密码 |
| `DATABASE_URL` 中的密码 | api 服务 | 与上面保持一致 |
| `JWT_SECRET` | api 服务 | 改为 32+ 位随机字符串 |
| `MEILI_MASTER_KEY` | meilisearch + api 服务 | 改为强密钥，两处保持一致 |
| `MINIO_ROOT_USER/PASSWORD` | minio 服务 | 改为自定义用户名密码 |
| `MINIO_ACCESS_KEY/SECRET_KEY` | api 服务 | 与上面 MinIO 凭据一致 |

> **💡 生成随机密钥的方法：**
> ```bash
> # 在 1Panel 终端中执行
> openssl rand -hex 32
> ```

### 第四步：修改端口（可选）

默认端口映射如下，如与已有服务冲突请修改**冒号左边**的端口号：

| 服务 | 默认端口 | 说明 |
|---|---|---|
| Web 前端 | `3000` | 主应用入口 |
| API 后端 | `4000` | REST API |
| PostgreSQL | `15432` | 数据库（已改为非标准端口避免冲突） |
| Redis | `16379` | 缓存（已改为非标准端口避免冲突） |
| Meilisearch | `17700` | 搜索引擎 |
| MinIO API | `19000` | 对象存储 API |
| MinIO Console | `19001` | 对象存储管理界面 |

> **⚠️ 注意：** 如果 1Panel 的应用商店中已安装了 PostgreSQL 或 Redis，端口会冲突。  
> 本配置已将基础设施端口改为 `15432`、`16379` 等非标准端口，避免与 1Panel 内置应用冲突。  
> 你也可以选择使用 1Panel 应用商店已安装的 PostgreSQL/Redis，只需删除对应的服务块并修改连接地址。

### 第五步：确认创建

1. 检查配置无误后，点击 **「确认」** 按钮
2. 1Panel 将自动拉取镜像并构建、启动所有容器
3. 等待提示 **「任务成功」**（首次构建约需 5-10 分钟）

### 第六步：初始化数据库

编排启动成功后，需要初始化数据库：

1. 进入 1Panel → **「容器」** → **「容器列表」**
2. 找到 `lb-api` 容器，点击右侧 **「终端」** 按钮
3. 在终端中依次执行：

```bash
# 运行数据库迁移
npx prisma migrate deploy

# （可选）填充演示数据
npx prisma db seed
```

或者通过 1Panel 的 **「终端」** 功能直接在宿主机执行：

```bash
docker exec lb-api npx prisma migrate deploy
docker exec lb-api npx prisma db seed
```

### 第七步：访问应用 🎉

| 服务 | 访问地址 | 说明 |
|---|---|---|
| 🌐 前端 | `http://服务器IP:3000` | 主应用 |
| 🔌 API | `http://服务器IP:4000` | REST API |
| 📖 Swagger | `http://服务器IP:4000/api/docs` | API 文档 |
| 📦 MinIO | `http://服务器IP:19001` | 对象存储管理 |

---

## 🌐 配置域名和 HTTPS（推荐）

### 通过 1Panel 创建反向代理

1. 进入 1Panel → **「网站」** → **「创建网站」**
2. 网站类型选择 **「反向代理」**
3. 填写域名（需提前在 DNS 服务商添加 A 记录指向服务器 IP）
4. 配置两个反向代理：

**前端反向代理：**
- 域名：`bookmarks.example.com`
- 代理地址：`http://127.0.0.1:3000`

**API 反向代理：**
- 域名：`api.bookmarks.example.com`
- 代理地址：`http://127.0.0.1:4000`

5. 创建完成后，在网站设置中点击 **「HTTPS」** → **「申请证书」**（1Panel 支持自动申请 Let's Encrypt 免费证书）

### 修改环境变量

配置域名后，需要更新 Docker Compose 中的相关配置：

```yaml
# api 服务中修改
FRONTEND_URL: https://bookmarks.example.com

# web 服务中修改
NEXT_PUBLIC_API_URL: https://api.bookmarks.example.com
```

修改后在 1Panel 编排页面重新部署即可。

---

## 🔧 使用 1Panel 已安装的 PostgreSQL / Redis

如果你已通过 1Panel 应用商店安装了 PostgreSQL 或 Redis，可以直接复用，无需再起额外的容器。

### 复用 1Panel PostgreSQL

1. 在 1Panel → **「数据库」** → **「PostgreSQL」** 中创建一个新数据库：
   - 数据库名：`leon_bookmarks`
   - 用户名：`leon`
   - 密码：自定义强密码

2. 删除 Docker Compose 中的 `postgres` 服务块和 `pgdata` 卷

3. 修改 `api` 服务的 `DATABASE_URL`：
   ```yaml
   # host.docker.internal 指向宿主机，1Panel 的 PG 通常监听 5432
   DATABASE_URL: postgresql://leon:你的密码@host.docker.internal:5432/leon_bookmarks
   ```

4. 移除 `api` 的 `depends_on` 中的 `postgres` 条目

### 复用 1Panel Redis

1. 删除 Docker Compose 中的 `redis` 服务块和 `redisdata` 卷

2. 修改 `api` 服务的 `REDIS_URL`：
   ```yaml
   REDIS_URL: redis://host.docker.internal:6379
   ```

3. 移除 `api` 的 `depends_on` 中的 `redis` 条目

---

## 📊 日常运维

### 在 1Panel 中查看日志

1. **「容器」** → **「容器列表」** → 找到目标容器 → 点击 **「日志」**
2. 或通过宿主机终端：
   ```bash
   docker logs -f lb-api     # 查看 API 日志
   docker logs -f lb-web     # 查看前端日志
   docker logs -f lb-postgres # 查看数据库日志
   ```

### 更新应用

```bash
# 进入编排目录
cd {1Panel安装目录}/1panel/docker/compose/leon-bookmarks

# 重新构建并启动
docker compose up -d --build api web

# 运行数据库迁移（如有新版本）
docker exec lb-api npx prisma migrate deploy
```

或在 1Panel 编排页面直接点击 **「重新部署」**。

### 数据备份

```bash
# 备份 PostgreSQL 数据
docker exec lb-postgres pg_dump -U postgres leon_bookmarks > backup_$(date +%Y%m%d).sql

# 恢复数据
docker exec -i lb-postgres psql -U postgres leon_bookmarks < backup_20241101.sql
```

> **💡 提示：** 也可以在 1Panel → **「数据库」** 中直接使用 1Panel 的数据库备份功能（如果复用了 1Panel 的 PostgreSQL）。

---

## 🧑‍💻 演示账号

种子数据填充后可用：

| 邮箱 | 密码 | 租户 | 角色 |
|---|---|---|---|
| `leon@bookmarks.dev` | `password123` | Acme Dev Team | Admin |
| `alice@bookmarks.dev` | `password123` | Acme Dev Team | Editor |
| `designer@creative.dev` | `password123` | Creative Studio | Admin |

---

## ❓ 常见问题

### Q: 首次构建很慢怎么办？

A: 首次需要从 GitHub 拉取代码并构建 Docker 镜像（约 5-10 分钟）。如果网络较慢，可以先在本地构建好镜像后导入：

```bash
# 在开发机上构建
docker build -t leon-bookmarks-api -f apps/api/Dockerfile .
docker build -t leon-bookmarks-web -f apps/web/Dockerfile .

# 导出
docker save leon-bookmarks-api | gzip > api.tar.gz
docker save leon-bookmarks-web | gzip > web.tar.gz

# 在服务器上导入
docker load < api.tar.gz
docker load < web.tar.gz
```

然后将 Docker Compose 中的 `build` 配置改为 `image`：
```yaml
api:
  image: leon-bookmarks-api:latest
  # 删除 build 块

web:
  image: leon-bookmarks-web:latest
  # 删除 build 块
```

### Q: 端口被占用？

A: 修改 Docker Compose 中冒号左边的端口号。例如将前端改为 8080：
```yaml
ports:
  - "8080:3000"
```

### Q: 如何配置 AI 功能？

A: AI 供应商在超级管理后台配置，无需修改 Docker 环境变量：
1. 使用 `leon@bookmarks.dev` 账号登录
2. 进入 **「Super Admin」** → **「AI Providers」**
3. 添加 AI 供应商（支持 OpenAI、DeepSeek、月之暗面、智谱、硅基流动、Ollama 等）
4. 点击 **「Test」** 测试连接后设为默认

### Q: 如何连接 1Panel 的 OpenResty 做反向代理？

A: 参考上方 [配置域名和 HTTPS](#-配置域名和-https推荐) 章节，通过 1Panel 网站管理创建反向代理即可。

---

## 📄 License

MIT
