# 部署指南入口

更新时间：2026-07-06

本文件保留为旧链接入口。当前推荐部署方式已经切换为：

- Docker Compose 管理 `postgres + app + auto-cancel-worker`
- `app` 与 `auto-cancel-worker` 镜像从 GHCR 拉取
- Nginx / HTTPS 作为外层反向代理
- LINE Webhook 使用公开 HTTPS 地址

请按下面文档执行：

1. `docs/deployment/deployment-v1.md`：Ubuntu 单机 Docker 部署
2. `docs/deployment/nginx-https-v1.md`：Nginx 与 HTTPS
3. `docs/deployment/line-setup-v1.md`：LINE Messaging API 配置
4. `docs/deployment/deployment-checklist-v1.md`：上线验收清单

旧版 Node.js + PM2 + 本机 PostgreSQL 部署说明已不再作为当前项目主口径维护。
