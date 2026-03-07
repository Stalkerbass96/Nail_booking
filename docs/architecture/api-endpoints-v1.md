# API Endpoints V1

最后更新：2026-03-07

说明：
- 所有接口都使用 Next.js Route Handlers 实现。
- 默认返回 JSON。
- 管理端接口依赖管理员登录态。

## 1. Public APIs

### 服务展示

- `GET /api/public/categories`
  - query:
    - `lang=zh|ja` 可选

- `GET /api/public/packages`
  - query:
    - `lang=zh|ja` 可选
    - `categoryId` 可选

- `GET /api/public/packages/{id}`
  - query:
    - `lang=zh|ja` 可选

- `GET /api/public/packages/{id}/addons`
  - query:
    - `lang=zh|ja` 可选

### 预约

- `GET /api/public/availability`
  - query:
    - `packageId` 必填
    - `date` 必填，格式 `YYYY-MM-DD`
    - `addonIds` 可选，多个加项 ID 用逗号分隔
  - 已接入规则：
    - 每周营业时间
    - 特殊营业日
    - 后台手动封锁时间段
    - 已存在预约占用

- `POST /api/public/appointments`
  - 创建预约，初始状态为 `pending`
  - 会再次校验营业时间、封锁时间、预约冲突和套餐总时长

- `GET /api/public/appointments/lookup`
  - 使用 `email + bookingNo` 查询预约

### Public LINE

- `POST /api/public/line/link`
  - 顾客使用 `bookingNo + email` 发起 LINE 自助绑定
  - 返回账号绑定流程需要的跳转信息

- `POST /api/public/line/manage`
  - 查询顾客当前 LINE 绑定状态

- `DELETE /api/public/line/manage`
  - 解除顾客当前 LINE 绑定

- `GET /api/line/webhook`
  - LINE webhook 健康检查入口

- `POST /api/line/webhook`
  - 接收 `follow / unfollow / message / accountLink` 事件

## 2. Admin APIs

### 登录

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`

### 预约管理

- `GET /api/admin/appointments`
- `PATCH /api/admin/appointments/{id}/confirm`
- `PATCH /api/admin/appointments/{id}/cancel`
- `PATCH /api/admin/appointments/{id}/complete`

### 排班与封锁

- `GET /api/admin/schedule`
  - 返回每周营业时间、特殊营业日与封锁区间

- `PATCH /api/admin/schedule`
  - 更新每周营业时间

- `POST /api/admin/schedule`
  - `type=specialDate` 新增特殊营业日
  - `type=block` 新增手动封锁时间段

- `DELETE /api/admin/schedule/special-dates/{id}`
- `DELETE /api/admin/schedule/blocks/{id}`

### 分类管理

- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PATCH /api/admin/categories/{id}`
- `POST /api/admin/categories/batch`
  - `action=setActive`
  - `action=setSortOrder`

### 套餐管理

- `GET /api/admin/packages`
- `POST /api/admin/packages`
- `PATCH /api/admin/packages/{id}`

### 加项管理

- `GET /api/admin/addons`
- `POST /api/admin/addons`
- `PATCH /api/admin/addons/{id}`

### 顾客与积分

- `GET /api/admin/customers`
- `GET /api/admin/customers/{id}`
- `POST /api/admin/customers/{id}/points`
- `GET /api/admin/points/ledger`
- `POST /api/admin/points/use`

### Admin LINE

- `GET /api/admin/line/users`
  - 返回最近 LINE 用户列表
  - 每个用户包含：
    - 绑定顾客信息
    - 最新一条消息
    - `unreadCount`

- `GET /api/admin/line/users/{id}/messages`
  - 返回某个 LINE 用户的 1 对 1 会话
  - 打开会话时会自动把该用户的 incoming 未读消息写入 `readAt`

- `PATCH /api/admin/line/users/{id}/bind`
  - 手动绑定或解绑顾客

- `POST /api/admin/line/users/{id}/message`
  - 后台主动发送消息

- `POST /api/admin/line/users/{id}/link-request`
  - 向顾客发送 LINE 自助绑定链接
  - 依赖 `APP_BASE_URL`、`LINE_CHANNEL_SECRET`、`LINE_CHANNEL_ACCESS_TOKEN`

### 系统设置

- `GET /api/admin/system-settings`
- `PATCH /api/admin/system-settings`

当前字段包括：
- `slotMinutes`
- `pendingAutoCancelHours`
- `cancelCutoffHours`
- `pointEarnRatioJpy`
- `pointRedeemRatioJpy`

## 3. System Job API

- `GET /api/system/jobs/auto-cancel-pending`
  - 执行待确认预约自动取消任务
  - 需要 `CRON_SECRET` 通过鉴权
