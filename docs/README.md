# Docs Index

文档按两条主线组织：
- 产品与需求
- 开发、运行、部署与接手

## 建议阅读顺序

1. `requirements/requirements-v1.1.md`
2. `prd/prd-v2.md`
3. `architecture/implementation-v3.md`
4. `architecture/agent-handoff-v1.md`
5. `architecture/api-endpoints-v1.md`
6. `architecture/frontend-routes-v1.md`
7. `architecture/local-runbook-v1.md`
8. `deployment/deployment-v1.md`
9. `deployment/deployment-checklist-v1.md`
10. `deployment/nginx-https-v1.md`
11. `deployment/line-setup-v1.md`
12. `operations/notes-v1.md`
13. `testing/acceptance-v1.md`
14. `CHANGELOG.md`

## 面向人的入口

- 想理解需求边界：看 `requirements` 和 `prd`
- 想继续开发：看 `agent-handoff`、`implementation`、API/route 文档
- 想本地启动：看 `architecture/local-runbook-v1.md`
- 想在全新 Ubuntu 云主机上一步步部署：看 `deployment/deployment-v1.md`
- 想做部署验收：看 `deployment/deployment-checklist-v1.md`
- 想接域名、Nginx 和 HTTPS：看 `deployment/nginx-https-v1.md`
- 想接入 LINE Messaging API：看 `deployment/line-setup-v1.md`

## 面向 AI agent 的最低接手集合

最少读这 5 份：
1. `docs/architecture/agent-handoff-v1.md`
2. `docs/architecture/implementation-v3.md`
3. `docs/architecture/api-endpoints-v1.md`
4. `docs/architecture/frontend-routes-v1.md`
5. `docs/deployment/deployment-v1.md`

## 文档维护规则

任何影响运行或部署的改动，提交时至少同步更新下面文档中的一项：
- 运行方式变更：`architecture/local-runbook-v1.md`
- 部署方式变更：`deployment/deployment-v1.md`
- 部署验收变更：`deployment/deployment-checklist-v1.md`
- 反向代理或 HTTPS 变更：`deployment/nginx-https-v1.md`
- API 或页面结构变更：`architecture/api-endpoints-v1.md` 或 `frontend-routes-v1.md`
- 需求边界变更：`requirements/` 或 `prd/`
