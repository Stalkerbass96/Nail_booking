# Frontend Routes V1

- 更新日期：2026-03-07

## 1. Public

- `/`
- `/services`
- `/services/{id}`
- `/booking`
- `/booking/success/{bookingNo}`
- `/booking/lookup`

## 2. Admin

- `/admin/login`
- `/admin`
- `/admin/appointments`
- `/admin/categories`
- `/admin/packages`
- `/admin/addons`
- `/admin/customers`
- `/admin/points`
- `/admin/settings`

## 3. 访问与鉴权说明

- Public 页面无需登录。
- Admin 页面需登录（除 `/admin/login`）。
- 未登录访问 admin 页面会自动跳转到 `/admin/login?next=...`。
- `/admin/*` 与 `/api/admin/*` 都受中间件保护。

## 4. 多语言说明

- 前后台页面均支持 `?lang=zh|ja`。
- 管理端导航会自动保留并传递当前 `lang` 参数。

## 5. 备注

- 后台视觉已做统一商品化改造（仅样式与交互层，不改业务逻辑）。