# LINE Setup V1

最后更新：2026-03-07

这份文档单独说明本项目如何接入 LINE。

目标包含 4 件事：
- 顾客与 LINE 账号绑定
- 后台接收顾客 LINE 消息
- 店长在后台向顾客发送消息
- 后续支持 1 对 1 会话与链接生成

## 1. 本项目当前支持的 LINE 功能

当前代码已经支持：
- LINE Webhook 接收 `follow / unfollow / message / accountLink`
- 后台查看 LINE 用户列表与会话历史
- 后台主动发送文字消息
- 顾客使用 `bookingNo + email` 完成自助绑定
- 店长从后台发送绑定链接
- 未读消息统计与已读状态

当前依赖的页面与接口：
- 后台页面：`/admin/line`
- 顾客绑定页：`/line/link`
- 顾客绑定管理页：`/line/manage`
- Webhook：`/api/line/webhook`

## 2. 你需要准备什么

在 LINE Developers Console 里，你至少需要：
- 一个 Messaging API Channel
- `Channel secret`
- `Channel access token`

如果你要在公网环境里实际使用，还需要：
- 一个外部可访问的 `APP_BASE_URL`
- 推荐是 `https://your-domain.com`

## 3. 本项目使用的环境变量

需要配置到：
- 本地开发：`.env`
- Ubuntu 单机部署：`.env.deploy`

关键变量：

```env
APP_BASE_URL=https://your-domain.com
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_AUTO_REPLY_TEXT=Message received. The salon owner will reply to you shortly.
```

说明：
- `APP_BASE_URL` 用于生成顾客可打开的自助绑定链接
- `LINE_CHANNEL_SECRET` 用于校验 Webhook 签名
- `LINE_CHANNEL_ACCESS_TOKEN` 用于后台主动推送消息
- `LINE_AUTO_REPLY_TEXT` 是收到顾客消息后的自动回复文本，可选


## 3.1 在 LINE Developers Console 中的实际配置步骤

1. 登录 [LINE Developers Console](https://developers.line.biz/console/)
2. 创建或选择一个 Provider
3. 创建 `Messaging API channel`
4. 进入该 channel 后，记录两项：
   - `Channel secret`
   - `Channel access token`
5. 在 `Messaging API` 设置页中找到 Webhook 配置
6. 把 Webhook URL 设置为：
   - `https://your-domain.com/api/line/webhook`
7. 打开 `Use webhook`
8. 如果 LINE 控制台提供 `Verify` 按钮，先用它测试一次
9. 把 `Channel secret` 和 `Channel access token` 写入服务器环境变量

说明：
- 当前项目接的是 `Messaging API`，不是必须要求所有顾客都使用 LINE
- 没有 LINE 的顾客，仍然可以正常通过网页预约和查询预约
- 有 LINE 的顾客，可以额外获得账号绑定、消息通知和 1 对 1 对话能力

## 4. Webhook 应该配置到哪里

本项目 Webhook 路径固定为：

```text
/api/line/webhook
```

如果你的域名是：

```text
https://your-domain.com
```

那么在 LINE Developers Console 中应配置为：

```text
https://your-domain.com/api/line/webhook
```

不要使用：
- `http://127.0.0.1:3000/api/line/webhook`
- `http://localhost:3000/api/line/webhook`

这些地址对 LINE 平台不可达。

## 5. Ubuntu 单机部署时怎么配

编辑 `.env.deploy`：

```bash
nano .env.deploy
```

填入：

```env
APP_BASE_URL=https://your-domain.com
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_AUTO_REPLY_TEXT=Message received. The salon owner will reply to you shortly.
```

然后重新部署：

```bash
./scripts/deploy-docker.sh
```

## 6. 如果你现在只是做服务器测试

如果你现在只是先把预约系统部署起来，还没有正式接 LINE：
- 可以先不填 `LINE_CHANNEL_SECRET`
- 可以先不填 `LINE_CHANNEL_ACCESS_TOKEN`

这样不会影响：
- 前台预约
- 后台预约管理
- 排班与封锁
- 顾客与积分管理

但这些功能会不可用：
- 后台主动发送 LINE 消息
- 顾客真实接收绑定链接
- LINE Webhook 真实校验

## 7. 接入后的最小验证步骤

1. 在 LINE Developers Console 配置 Webhook URL
2. 在服务器 `.env.deploy` 写入 `APP_BASE_URL`、`LINE_CHANNEL_SECRET`、`LINE_CHANNEL_ACCESS_TOKEN`
3. 执行 `./scripts/deploy-docker.sh`
4. 打开后台 `/admin/line`
5. 让测试账号向 LINE Official Account 发一条消息
6. 在后台确认是否出现新会话
7. 从后台发送一条测试消息给顾客
8. 从后台发送一条绑定链接，检查顾客能否打开 `/line/link`

## 8. 常见问题

### 8.1 后台能打开 LINE 页面，但发不出消息

优先检查：
- `LINE_CHANNEL_ACCESS_TOKEN` 是否已配置
- token 是否过期
- app 容器里是否已加载新环境变量

部署后查看：

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=100 app
```

### 8.2 Webhook 一直失败

优先检查：
- `LINE_CHANNEL_SECRET` 是否正确
- Webhook URL 是否是公网 HTTPS 地址
- 反向代理是否正确转发到 `/api/line/webhook`

### 8.3 顾客收到的绑定链接打不开

优先检查：
- `APP_BASE_URL` 是否仍是 `localhost` 或 `127.0.0.1`
- 域名是否能从外网打开
- HTTPS 是否已生效

## 9. 建议

如果你准备正式上线 LINE：
1. 先完成 `docs/deployment/nginx-https-v1.md`
2. 确保 `APP_BASE_URL` 使用正式域名
3. 再配置 Webhook 和主动发信 token
