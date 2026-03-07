# CHANGELOG

## 2026-03-07

### 文档与部署
- 新增 Ubuntu Nginx + HTTPS 文档，覆盖域名、反向代理、Certbot 与续期。
- 新增 .env.nginx.example 作为域名与证书配置占位模板。
- deploy-docker.sh 增加失败 trap、日志回显和 HTTP 探活。
- 重写根目录 `README.md`，明确本地开发、Ubuntu 单机部署和文档入口。
- 重写 `docs/deployment/deployment-v1.md`，补全 Ubuntu 22.04/24.04 从零部署步骤。
- 重写 `docs/README.md`、`docs/architecture/agent-handoff-v1.md`、`docs/architecture/local-runbook-v1.md`。
- 清理并重写实现架构、API 路由、前端路由文档，移除乱码。
- 新增 `.gitattributes`，固定 shell 脚本与部署文件使用 LF 行尾。

### 部署链路
- 修复 Docker 镜像构建时过早设置 NODE_ENV=production 导致缺少 Tailwind 构建依赖的问题。
- 去掉部署 compose 中固定 container_name，避免同主机重复部署时命名冲突。
- 调整部署脚本顺序为 postgres -> migrate/seed -> app + worker，消除首次部署竞态。
- `docker-compose.deploy.yml` 改为从 `.env.deploy` 读取数据库、端口和部署参数。
- `Dockerfile` 改为显式绑定 `0.0.0.0`，确保容器能从宿主机端口访问。
- `.env.deploy.example` 扩展为单机部署所需的完整变量集合。
- `scripts/deploy-docker.sh` 改为统一使用 `--env-file .env.deploy`，并在启动后输出访问地址。

### 验证
- `npm run build` 通过。
- `docker compose --env-file .env.deploy.example -f docker-compose.deploy.yml config` 通过。

## 2026-03-06

### MVP 第一轮实现
- 完成单店美甲预约的核心数据模型。
- 完成公开预约流程与后台基础管理页面。
- 接入后台登录鉴权、自动取消任务、种子数据与基础部署文档。


