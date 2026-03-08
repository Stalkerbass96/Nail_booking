# LINE Setup V1

最后更新：2026-03-08

这份文档说明 **2.0 LINE-first** 版本如何接入 LINE Messaging API。

## 1. 2.0 版本里 LINE 的职责

本项目当前主路径不是“先打开网页再绑定 LINE”，而是：
1. 顾客在线下扫码添加店铺 LINE 官方账号
2. LINE 平台把 `follow` 事件发到本项目 Webhook
3. 系统立即创建顾客档案，状态为“潜在客户”
4. 系统首次自动给顾客发送预约首页链接
5. 顾客从图墙首页选择款式并提交预约
6. 系统给顾客发送“待确认 + 预约号 + 详情链接”
7. 店长在后台确认预约
8. 系统给顾客发送“已确认 + 预约号 + 详情链接”

因此，2.0 里 LINE 负责：
- 顾客建档入口
- 预约主页导流
- 待确认通知
- 已确认通知
- 后台 1 对 1 文本会话

## 2. 当前代码已支持的 LINE 功能

- LINE Webhook 接收 `follow / unfollow / message / accountLink`
- `follow` 后自动创建顾客与 LINE 用户关联
- 只在首次 `follow` 时发送主页链接
- 后台查看 LINE 用户列表与会话历史
- 后台主动发送文字消息
- 后台给顾客发送预约主页 / 绑定 / 跟进消息
- 顾客仍可使用 `/line/link` 与 `/line/manage` 做已有兼容流程

当前依赖的页面与接口：
- 后台页面：`/admin/line`
- 图墙首页：`/`
- 顾客绑定页：`/line/link`
- 顾客绑定管理页：`/line/manage`
- Webhook：`/api/line/webhook`

## 3. 你需要准备什么

在 LINE Developers Console 里，你至少需要：
- 一个 Provider
- 一个 `Messaging API channel`
- `Channel secret`
- `Channel access token`

如果你要在公网环境里实际使用，还需要：
- 一个外部可访问的 `APP_BASE_URL`
- 推荐是 `https://your-domain.com`
- 一个能被 LINE 平台访问的 HTTPS Webhook 地址

## 4. 本项目使用的环境变量

需要配置到：
- 本地开发：`.env`
- Ubuntu 单机部署：`.env.deploy`

关键变量：

```env
APP_BASE_URL=https://your-domain.com
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_AUTO_REPLY_TEXT=Thanks for adding the salon LINE account. Please open the booking home page from the message link.
```

说明：
- `APP_BASE_URL` 用于生成首页链接、预约详情链接等顾客可打开的 URL
- `LINE_CHANNEL_SECRET` 用于校验 Webhook 签名
- `LINE_CHANNEL_ACCESS_TOKEN` 用于系统主动推送消息
- `LINE_AUTO_REPLY_TEXT` 是收到顾客自由文本消息后的自动回复文本，可选

## 5. LINE Developers Console 的配置步骤

1. 登录 [LINE Developers Console](https://developers.line.biz/console/)
2. 创建或选择一个 Provider
3. 创建 `Messaging API channel`
4. 进入该 channel 后，记录两项：
   - `Channel secret`
   - `Channel access token`
5. 打开 `Messaging API` 设置页
6. 把 Webhook URL 设置为：
   - `https://your-domain.com/api/line/webhook`
7. 打开 `Use webhook`
8. 如果控制台提供 `Verify` 按钮，先用它测试一次
9. 把 `Channel secret` 和 `Channel access token` 写入服务器环境变量

## 6. Webhook 应该配置到哪里

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

## 7. Ubuntu 单机部署时怎么配

编辑 `.env.deploy`：

```bash
nano .env.deploy
```

填入：

```env
APP_BASE_URL=https://your-domain.com
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_AUTO_REPLY_TEXT=Thanks for adding the salon LINE account. Please open the booking home page from the message link.
```

然后重新部署：

```bash
./scripts/deploy-docker.sh
```

## 8. 接入后的最小验证步骤

### 8.1 验证 Webhook

1. 在 LINE Developers Console 配置 Webhook URL
2. 点 `Verify`
3. 确认服务器日志里没有签名错误

### 8.2 验证加好友自动建档

1. 用测试 LINE 账号添加官方账号
2. 打开后台 `/admin/customers`
3. 应该立即看到一个新顾客
4. 顾客状态应该是“潜在客户”
5. 顾客详情里应能看到 LINE 档案信息

### 8.3 验证首次欢迎链接

1. 同一个测试账号首次 `follow`
2. 顾客应收到一条欢迎消息
3. 消息里应包含预约首页链接
4. 链接打开后应进入图墙首页 `/`

### 8.4 验证老好友补发图墙链接

如果某个顾客早已加过好友，没有重新触发首次欢迎消息：

1. 打开后台 `/admin/line`
2. 选中该 LINE 用户
3. 点击“发送图墙预约链接 / ギャラリー予約リンク送信”
4. 顾客应收到一条包含首页专属入口的 LINE 消息
5. 点击后应进入图墙首页，并可直接提交预约

### 8.5 验证图墙预约

1. 从欢迎消息或后台补发的图墙链接进入首页
2. 点击图墙中的某个款式
3. 进入预约页
4. 选择时间并提交预约
5. 顾客应收到“待确认 + 预约号 + 详情链接”
6. 后台 `/admin/appointments` 应看到该预约

### 8.6 验证确认通知

1. 店长在后台确认这笔预约
2. 顾客应收到“已确认 + 预约号 + 详情链接”

### 8.7 验证 1 对 1 会话

1. 顾客给官方账号发送一条自由文本消息
2. 后台 `/admin/line` 应出现会话
3. 店长从后台回一条消息
4. 顾客应在 LINE 中收到回复

## 9. 常见问题

### 9.1 Webhook 一直失败

优先检查：
- `LINE_CHANNEL_SECRET` 是否正确
- Webhook URL 是否是公网 HTTPS 地址
- 反向代理是否正确转发到 `/api/line/webhook`
- 服务器时间是否异常

### 9.2 加好友后没有自动建档

优先检查：
- Webhook 是否已打开 `Use webhook`
- `Verify` 是否成功
- 应用日志里是否收到了 `follow` 事件
- 数据库是否可写

### 9.3 顾客没有收到欢迎链接

优先检查：
- `LINE_CHANNEL_ACCESS_TOKEN` 是否正确
- 是否是首次 `follow`
- `APP_BASE_URL` 是否可从外网访问
- 后台 `/admin/line` 中是否记录了 `welcome_home` 系统消息

### 9.4 老好友无法进入图墙预约

优先检查：
- 后台 `/admin/line` 是否已执行“发送图墙预约链接”
- 该 LINE 用户是否能在后台正常打开会话
- 应用日志里是否有 `gallery_home` 发送记录
- `APP_BASE_URL` 是否已正确配置

### 9.5 顾客收到了链接，但打不开

优先检查：
- `APP_BASE_URL` 是否仍是 `localhost` 或 `127.0.0.1`
- 域名是否能从外网打开
- HTTPS 是否已生效

## 10. 建议顺序

如果你准备正式上线 2.0 的 LINE 流程，推荐按这个顺序做：
1. 先完成 `docs/deployment/deployment-v1.md`
2. 再完成 `docs/deployment/nginx-https-v1.md`
3. 确保 `APP_BASE_URL` 使用正式域名
4. 再配置 Webhook 和主动发信 token
5. 最后按本文件做 `follow -> welcome -> booking -> pending -> confirmed` 验收
