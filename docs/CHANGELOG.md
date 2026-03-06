# CHANGELOG

## 2026-03-07

### ✨ 功能与体验
- 新增系统设置后台页：`/admin/settings`
- 新增系统设置 API：`GET/PATCH /api/admin/system-settings`
- 前后台完成两轮 UI 商品化改造（卡片、按钮、输入、状态反馈统一）
- 移动端交互与可访问性完成一轮精修（focus/disabled/状态反馈）

### 🔐 安全与稳定性
- 管理鉴权改为 fail-closed：`ADMIN_AUTH_SECRET` 未配置直接拒绝
- 系统任务接口强制鉴权：`CRON_SECRET` 未配置返回 503
- 预约创建加入并发防重保护（事务内锁 + 冲突校验）

### 🧪 测试
- 新增 E2E 测试流程与产物目录
- 修复测试环境后，E2E 最新结果：**5/5 PASS**
- 报告：`docs/testing/e2e-report-2026-03-07.md`

### 📚 文档
- 全量刷新 README / 架构 / 运行手册 / 运维说明
- 更新部署手册（加入系统设置与上线检查项）

---

## 2026-03-06

### 🧱 基础能力
- 完成 MVP 主体：前台预约、后台管理、自动取消、积分体系
- 完成 Admin 鉴权、核心 API、数据库 schema 与 seed
- 完成 Docker 一体部署基础方案