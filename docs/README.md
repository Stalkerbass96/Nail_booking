# Docs Index

文档按两条主线组织：
- 产品与需求
- 开发、运行、部署与接手

## 建议阅读顺序

1. `requirements/requirements-v2.0-line-first.md`
2. `requirements/requirements-v1.1.md`
3. `prd/prd-v3-line-first.md`
4. `prd/prd-v2.md`
5. `architecture/data-model-v2.0-line-first.md`
6. `architecture/task-breakdown-v2.0-line-first.md`
7. `architecture/implementation-v3.md`
8. `architecture/agent-handoff-v1.md`
9. `architecture/api-endpoints-v1.md`
10. `architecture/frontend-routes-v1.md`
11. `architecture/local-runbook-v1.md`
12. `deployment/deployment-v1.md`
13. `deployment/deployment-checklist-v1.md`
14. `deployment/nginx-https-v1.md`
15. `deployment/line-setup-v1.md`
16. `operations/notes-v1.md`
17. `testing/acceptance-v1.md`
18. `CHANGELOG.md`

## 面向人的入口

- 想理解 2.0 最新需求：先看 `requirements/requirements-v2.0-line-first.md` 和 `prd/prd-v3-line-first.md`
- 想理解旧版 MVP 边界：看 `requirements/requirements-v1.1.md` 和 `prd/prd-v2.md`
- 想继续开发 2.0：看 `architecture/data-model-v2.0-line-first.md`、`architecture/task-breakdown-v2.0-line-first.md`、`agent-handoff`、`implementation`、API/route 文档
- 想本地启动：看 `architecture/local-runbook-v1.md`
- 想在全新 Ubuntu 云主机上一步步部署：看 `deployment/deployment-v1.md`
- 想做部署验收：看 `deployment/deployment-checklist-v1.md`
- 想接域名、Nginx 和 HTTPS：看 `deployment/nginx-https-v1.md`
- 想接入 LINE Messaging API：看 `deployment/line-setup-v1.md`

## 面向 AI agent 的最低接手集合

最少读这 6 份：
1. `docs/requirements/requirements-v2.0-line-first.md`
2. `docs/prd/prd-v3-line-first.md`
3. `docs/architecture/data-model-v2.0-line-first.md`
4. `docs/architecture/task-breakdown-v2.0-line-first.md`
5. `docs/architecture/implementation-v3.md`
6. `docs/deployment/deployment-v1.md`

## 文档维护规则

任何影响运行或部署的改动，提交时至少同步更新下面文档中的一项：
- 运行方式变更：`architecture/local-runbook-v1.md`
- 部署方式变更：`deployment/deployment-v1.md`
- 部署验收变更：`deployment/deployment-checklist-v1.md`
- 反向代理或 HTTPS 变更：`deployment/nginx-https-v1.md`
- API 或页面结构变更：`architecture/api-endpoints-v1.md` 或 `frontend-routes-v1.md`
- 需求边界变更：`requirements/` 或 `prd/`
