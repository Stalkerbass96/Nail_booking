# 文档总览

本目录用于沉淀 Nail Booking 项目需求、架构、测试、部署与运维知识。

## 阅读顺序（建议）

1. `requirements/requirements-v1.1.md`：需求冻结与业务规则来源
2. `prd/prd-v2.md`：可开发版产品范围与验收标准
3. `architecture/implementation-v3.md`：技术实现与当前完成度
4. `architecture/agent-handoff-v1.md`：给新 AI/开发者的接手文档
5. `architecture/api-endpoints-v1.md`：接口清单
6. `architecture/frontend-routes-v1.md`：页面与路由清单
7. `architecture/local-runbook-v1.md`：本地运行手册
8. `testing/e2e-report-2026-03-07.md`：最新 E2E 测试报告
9. `deployment/deployment-v1.md`：部署手册（生产/预发）
10. `operations/notes-v1.md`：备注、已知限制、后续建议

## 文档维护约定

- 文档编码统一 UTF-8。
- 需求变化先更新 `requirements` 与 `prd`，再更新 `architecture`。
- UI/测试相关变更同步更新 `testing` 与 `operations`。
- 每次发布前至少核对：
  - 环境变量文档
  - API 清单
  - 部署步骤
  - 测试报告
  - 已知限制

## 当前文档版本快照（2026-03-07）

- 需求：V1.1
- PRD：V2
- 实施清单：V3（已含系统设置与安全修复）
- AI 接手文档：V1（已按当前代码状态刷新）
- 部署文档：V1
- 运维备注：V1（已更新）
- E2E 报告：2026-03-07（修复后 5/5 PASS）