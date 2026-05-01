# Operations Notes V1

更新时间：2026-05-01

## 1. 当前运行结论

- 系统支持单机部署：`postgres + app + auto-cancel-worker`
- 预约粒度当前固定为 30 分钟模型，系统设置层面允许的值也已收敛到 30 分钟倍数
- 待确认预约会占用档期，超时后由 worker 自动取消并释放档期
- 当前支付为线下处理，系统记录实付金额与积分变化
- LINE Webhook 已接入，follow 自动建档、预约通知、确认通知均已上线

## 2. 线上运维建议

1. 首次上线后，先验证：
   - `/admin/login` 可访问
   - 种子账号能登录
   - 公开图墙接口可访问（`/api/public/showcase`）
   - worker 容器在运行
   - LINE Webhook URL 在 LINE Developer Console 已配置并通过验证
2. 修改过 `.env.deploy` 后，执行一次重启：

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml restart
```

3. 更新版本后，检查日志中是否有：
   - Prisma migrate 报错
   - PostgreSQL 连接失败
   - worker 循环异常
   - LINE Webhook 签名验证失败（检查 `LINE_CHANNEL_SECRET` 是否正确）

## 3. 已知限制

- 暂未接入邮件通知
- LINE 会话当前仅支持文本消息（不支持图片、模板消息）
- 不支持顾客在预约流程中切换套餐
- 后台预约完成流程仍可继续优化为更完整的表单

## 4. 建议的上线验收清单

1. 前台图墙首页可访问
2. 后台登录可访问
3. 可以读取图墙与分类数据
4. 可以从图墙进入预约并提交
5. 可以在后台确认预约
6. worker 容器正常运行（`docker compose ps` 查看状态）
7. LINE Webhook 配置完成，`follow` 事件可正常接收
8. 顾客加好友后能在后台顾客列表看到新建档案
9. 顾客提交预约后 LINE 能收到待确认消息
10. 店长确认预约后 LINE 能收到已确认消息
11. `npm run test:e2e` 或手动 smoke 通过

## 5. 部署脚本备注

- `scripts/deploy-docker.sh` 会在失败时自动输出 compose 状态和最近日志。
- 脚本会对 `http://127.0.0.1:<APP_PORT>/api/public/categories` 做探活，避免服务启动失败但流程仍显示成功。
