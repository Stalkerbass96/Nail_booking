# Frontend Routes V1

更新时间：2026-03-07

## 1. Public Routes

- `/`
- `/services`
- `/services/{id}`
- `/booking`
- `/booking/success/{bookingNo}`
- `/booking/lookup`

## 2. Admin Routes

- `/admin/login`
- `/admin`
- `/admin/appointments`
- `/admin/categories`
- `/admin/packages`
- `/admin/addons`
- `/admin/customers`
- `/admin/points`
- `/admin/settings`

## 3. 访问控制

- Public 页面默认可匿名访问。
- Admin 页面需要登录，未登录会跳转到 `/admin/login`。
- 访问受保护页面时，系统会保留 `next` 参数，登录后跳回原页面。
- `/admin/*` 与 `/api/admin/*` 均受 middleware 保护。

## 4. 多语言说明

- 当前通过 URL 参数 `?lang=zh|ja` 控制语言。
- 页面间跳转时会尽量保留当前 `lang` 参数。
- 公共页面和管理页面都支持中日双语。

## 5. 备注

- 当前前台主要以预约闭环和服务展示为目标。
- 当前后台主要以店长单人运营为目标，不涉及复杂权限模型。
