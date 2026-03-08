# API Endpoints V1

最后更新：2026-03-08

本文档记录当前代码里的主要 API 路由，口径以 **2.0 LINE-first** 为准。

## 1. Public APIs

### 首页与图墙

- `GET /api/public/showcase`
  - 获取前台图墙项
  - 支持分类筛选
  - 返回图墙图片、标题、关联套餐、基础价格与分类信息

- `GET /api/public/categories`
  - 获取前台分类列表

### 预约流程

- `GET /api/public/availability`
  - 获取可预约时间段
  - 支持通过 `showcaseItemId` 计算套餐时长
  - 旧版 `packageId + addonIds` 参数仍保留兼容

- `POST /api/public/appointments`
  - 创建预约
  - 2.0 主路径参数：`entry + showcaseItemId + startAt + customerNote + lang`
  - 根据 `entry` 找到 LINE 用户和顾客
  - 提交成功后将顾客从 `lead` 转为 `active`
  - 写入 `showcaseItemId` 与 `sourceChannel=line_showcase`
  - 成功后发送 LINE 待确认通知

- `GET /api/public/appointments/lookup`
  - 旧版兼容查询接口
  - 仍支持公开详情页场景，但不再是 2.0 主路径

### LINE 公开接口

- `POST /api/public/line/link`
  - 旧版兼容的 LINE 自助绑定入口

- `POST /api/public/line/manage`
  - 查询顾客当前 LINE 绑定状态

- `DELETE /api/public/line/manage`
  - 解除顾客当前 LINE 绑定

### LINE Webhook

- `GET /api/line/webhook`
  - Webhook 健康检查入口

- `POST /api/line/webhook`
  - 接收 `follow / unfollow / message / accountLink`
  - `follow` 时自动创建潜在顾客并发送首次主页链接
  - `message` 时写入 LINE 会话消息

## 2. Admin APIs

### 预约管理

- `GET /api/admin/appointments`
  - 获取预约列表
  - 支持 `date / status / lang / limit`
  - 返回顾客、套餐、图墙来源、加项与来源渠道

- `PATCH /api/admin/appointments/{id}/confirm`
  - 确认预约
  - 成功后发送 LINE 已确认通知

- `PATCH /api/admin/appointments/{id}/cancel`
  - 取消预约

- `PATCH /api/admin/appointments/{id}/complete`
  - 完成预约并写入实收金额、积分使用等信息

### 图墙管理

- `GET /api/admin/showcase`
  - 获取后台图墙项列表

- `POST /api/admin/showcase`
  - 新建图墙项

- `PATCH /api/admin/showcase/{id}`
  - 更新图墙项

- `DELETE /api/admin/showcase/{id}`
  - 删除图墙项

### 顾客管理

- `GET /api/admin/customers`
  - 获取顾客列表
  - 支持按姓名、邮箱、LINE 昵称、LINE ID 搜索
  - 返回顾客类型、来源、LINE 关联状态

- `GET /api/admin/customers/{id}`
  - 获取顾客详情
  - 返回顾客类型、来源、LINE 档案、预约历史与图墙来源

- `GET /api/admin/customers/{id}/points`
  - 获取顾客积分流水

- `PATCH /api/admin/customers/{id}`
  - 顾客资料维护接口（如仓库当前实现存在）

### 套餐 / 分类 / 加项

- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PATCH /api/admin/categories/{id}`
- `DELETE /api/admin/categories/{id}`
- `POST /api/admin/categories/batch`

- `GET /api/admin/packages`
- `POST /api/admin/packages`
- `PATCH /api/admin/packages/{id}`
- `DELETE /api/admin/packages/{id}`

- `GET /api/admin/addons`
- `POST /api/admin/addons`
- `PATCH /api/admin/addons/{id}`
- `DELETE /api/admin/addons/{id}`

### 排班 / 封锁 / 系统设置

- `GET /api/admin/schedule`
  - 获取每周营业时间、特殊营业日、封锁区间

- `PUT /api/admin/schedule`
  - 更新每周营业时间

- `POST /api/admin/schedule`
  - 新增特殊营业日或封锁区间

- `DELETE /api/admin/schedule/blocks/{id}`
  - 删除封锁区间

- `DELETE /api/admin/schedule/special-dates/{id}`
  - 删除特殊营业日

- `GET /api/admin/system-settings`
- `PUT /api/admin/system-settings`

### 积分

- `GET /api/admin/points/ledger`
- `POST /api/admin/points/use`

### LINE 后台

- `GET /api/admin/line/users`
  - 获取 LINE 用户列表、未读状态、绑定状态

- `GET /api/admin/line/users/{id}/messages`
  - 获取单个 LINE 会话消息

- `POST /api/admin/line/users/{id}/message`
  - 后台主动发送文本消息

- `POST /api/admin/line/users/{id}/bind`
  - 后台手动绑定 LINE 用户与顾客

- `POST /api/admin/line/users/{id}/link-request`
  - 后台发送链接消息给顾客

### 后台认证

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`

## 3. 系统任务

- `POST /api/system/jobs/auto-cancel-pending`
  - 自动取消超时未确认预约

## 4. 当前 2.0 重要说明

- 顾客主身份已经切到 `LINE userId -> Customer`
- `email + bookingNo` 不再是主业务路径
- 首页主入口改为图墙
- 预约主创建路径改为 `entry + showcaseItemId`
- 旧接口仍有部分保留，仅用于兼容和过渡
