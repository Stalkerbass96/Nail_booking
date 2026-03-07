# API Endpoints V1

更新时间：2026-03-07

说明：
- 所有接口均由 Next.js Route Handlers 提供。
- 返回格式默认 JSON。
- 管理端接口需要登录态；公开接口不需要登录。

## 1. Public APIs

### 服务目录

- `GET /api/public/categories`
  - query:
    - `lang=zh|ja`（可选）

- `GET /api/public/packages`
  - query:
    - `lang=zh|ja`（可选）
    - `categoryId`（可选）

- `GET /api/public/packages/{id}`
  - query:
    - `lang=zh|ja`（可选）

- `GET /api/public/packages/{id}/addons`
  - query:
    - `lang=zh|ja`（可选）

### 预约

- `GET /api/public/availability`
  - query:
    - `packageId`（必填）
    - `date`（必填，格式 `YYYY-MM-DD`）
    - `addonIds`（可选，多值）

- `POST /api/public/appointments`
  - 创建预约，默认状态为 `pending`
  - 创建时会进行营业时间校验、冲突校验、档期占用与自动取消时间计算

- `GET /api/public/appointments/lookup`
  - 使用 `email + bookingNo` 查询预约状态

## 2. Admin APIs

### 认证

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`

### 预约管理

- `GET /api/admin/appointments`
- `PATCH /api/admin/appointments/{id}/confirm`
- `PATCH /api/admin/appointments/{id}/cancel`
- `PATCH /api/admin/appointments/{id}/complete`

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

### 客户与积分

- `GET /api/admin/customers`
- `GET /api/admin/customers/{id}`
- `POST /api/admin/customers/{id}/points`
- `GET /api/admin/points/ledger`
- `POST /api/admin/points/use`

### 系统设置

- `GET /api/admin/system-settings`
- `PATCH /api/admin/system-settings`

当前支持的关键设置：
- `slotMinutes`
- `pendingAutoCancelHours`
- `cancelCutoffHours`
- `pointEarnRatioJpy`
- `pointRedeemRatioJpy`

## 3. System Job API

- `GET /api/system/jobs/auto-cancel-pending`
  - 用于执行一次待确认预约自动取消
  - 应配合 `CRON_SECRET` 使用，不应公开暴露
