# Acceptance Testing V1

最后更新：2026-03-07

这个脚本用于验证当前项目最关键的业务闭环，覆盖：
- 排班与封锁时间
- LINE 自助绑定
- LINE 未读消息读写状态
- 预约从创建到完成的生命周期
- 积分入账

## 运行方式

```bash
npm run test:e2e:acceptance
```

建议在本地或 CI 中使用下面的串行校验命令，避免 `.next` 被多个进程同时写入：

```bash
npm run verify
```

对应脚本：
- `e2e/acceptance.cjs`
- `scripts/clean-next.cjs`
- `scripts/verify.cjs`

测试结果会输出到：
- `docs/testing/artifacts/acceptance-YYYY-MM-DD/acceptance-summary.json`

## 当前覆盖范围

1. 读取某日基础可预约时间
2. 创建后台封锁区间
3. 再次读取可预约时间并确认时段减少
4. 创建整日关闭的特殊营业日
5. 校验该日返回 0 个可预约时间
6. 清理封锁与特殊营业日
7. 创建一笔测试预约
8. 使用 `bookingNo + email` 发起 LINE 自助绑定
9. 模拟 `accountLink` webhook 完成绑定
10. 模拟顾客发来一条 LINE 消息
11. 校验后台 LINE 用户列表的 `unreadCount > 0`
12. 打开会话并确认 `unreadCount` 被清零
13. 执行公开解绑
14. 创建一笔新的测试预约
15. 后台确认预约
16. 后台完成预约
17. 校验积分到账与顾客累计数据
18. 清理测试数据

## 环境要求

运行前需要满足：
- PostgreSQL 已启动
- `.env` 已存在且数据库连接可用
- Prisma migration 已执行
- 依赖已安装

推荐准备命令：

```bash
npm install
npm run prisma:migrate:deploy
npm run prisma:generate
npm run db:seed
npm run test:e2e:acceptance
```

## LINE 配置说明

脚本支持两种模式：

1. 已配置真实 `LINE_CHANNEL_SECRET`
- 会使用当前环境变量完成 webhook 签名验证
- `line-self-linking` 与未读消息测试都会完整执行

2. 未配置真实 `LINE_CHANNEL_SECRET`
- 如果脚本自己拉起开发服务，会临时注入一个测试 secret
- 这样本地仍可跑通 LINE 绑定和未读消息验收
- 不会真的调用 LINE 平台主动推送接口

补充：
- 后台主动发信仍依赖 `LINE_CHANNEL_ACCESS_TOKEN`
- 若未配置主动发信 token，本验收不会强行调用外部 LINE 发送接口

## 可选环境变量

```env
E2E_BASE_URL=http://127.0.0.1:3000
E2E_ARTIFACT_DIR=docs/testing/artifacts/custom-run
E2E_ADMIN_EMAIL=owner@nail-booking.local
E2E_ADMIN_PASSWORD=your-admin-password
E2E_SERVER_START_TIMEOUT_MS=45000
APP_BASE_URL=http://127.0.0.1:3000
LINE_CHANNEL_SECRET=
```

## 结果判定

脚本输出 JSON 摘要，核心字段包括：
- `PASS`
- `FAIL`
- `SKIP`
- `passCount`
- `failCount`
- `skipCount`

验收通过标准：
- `failCount = 0`
