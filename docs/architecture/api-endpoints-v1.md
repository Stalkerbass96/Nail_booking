# API Endpoints V1

- 更新日期：2026-03-06
- 基础路径：同 Next.js 应用域名
- 返回格式：JSON

## 1. Public APIs

### 分类与服务

- `GET /api/public/categories`
  - query: `lang=zh|ja`（可选）

- `GET /api/public/packages`
  - query: `lang=zh|ja`（可选）, `categoryId`（可选）

- `GET /api/public/packages/{id}`
  - query: `lang=zh|ja`（可选）

- `GET /api/public/packages/{id}/addons`
  - query: `lang=zh|ja`（可选）

### 预约

- `GET /api/public/availability`
  - query:
    - `packageId`（必填）
    - `date`（必填，`YYYY-MM-DD`）
    - `addonIds`（可选，逗号分隔）

- `POST /api/public/appointments`
  - 创建预约（状态为 `pending`）

- `GET /api/public/appointments/lookup`
  - 使用 `email + bookingNo` 查询预约

## 2. Admin APIs（需登录）

### 鉴权

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`

### 预约

- `GET /api/admin/appointments`
- `PATCH /api/admin/appointments/{id}/confirm`
- `PATCH /api/admin/appointments/{id}/cancel`
- `PATCH /api/admin/appointments/{id}/complete`

### 分类

- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PATCH /api/admin/categories/{id}`
- `POST /api/admin/categories/batch`
  - `action=setActive`：批量启停
  - `action=setSortOrder`：批量更新排序

### 套餐

- `GET /api/admin/packages`
- `POST /api/admin/packages`
- `PATCH /api/admin/packages/{id}`

### 加项

- `GET /api/admin/addons`
- `POST /api/admin/addons`
- `PATCH /api/admin/addons/{id}`

### 客户

- `GET /api/admin/customers`
- `GET /api/admin/customers/{id}`
- `GET /api/admin/customers/{id}/points`

### 积分

- `GET /api/admin/points/ledger`
- `POST /api/admin/points/use`

## 3. System APIs

- `POST /api/system/jobs/auto-cancel-pending`
  - 功能：取消所有超时 `pending` 预约
  - 当设置 `CRON_SECRET` 时，需请求头 `x-cron-secret`

## 4. 备注

- `/admin/*` 与 `/api/admin/*` 均由中间件鉴权。
- 支持 `?lang=zh|ja` 的接口会返回本地化显示字段（同时保留原始中/日文字段）。
