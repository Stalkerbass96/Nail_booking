# Frontend Routes V1

最后更新：2026-03-07

## 1. Public Routes

- `/`
  - 前台首页
  - 展示品牌介绍、预约入口、服务亮点

- `/services`
  - 服务列表页
  - 按分类展示套餐

- `/services/{id}`
  - 服务详情页
  - 展示套餐说明、图片、时长、价格、可选加项

- `/booking`
  - 顾客预约页
  - 选择套餐、加项、日期、可用时段并提交预约

- `/booking/lookup`
  - 顾客预约查询页
  - 使用 `bookingNo + email` 查询预约

- `/booking/success/{bookingNo}`
  - 预约成功页
  - 展示预约编号和后续操作提示

- `/line/link`
  - LINE 自助绑定页
  - 顾客使用 `bookingNo + email` 完成 LINE 绑定

- `/line/manage`
  - LINE 绑定管理页
  - 顾客查看当前绑定状态并可主动解绑

## 2. Admin Routes

- `/admin/login`
  - 店长登录页

- `/admin`
  - 管理后台首页
  - 显示预约、顾客、LINE、排班概览

- `/admin/appointments`
  - 预约管理页
  - 查看、筛选、确认、取消、完成预约

- `/admin/schedule`
  - 排班管理页
  - 维护每周营业时间、特殊营业日、封锁时段

- `/admin/categories`
  - 分类管理页

- `/admin/packages`
  - 套餐管理页

- `/admin/addons`
  - 加项管理页

- `/admin/customers`
  - 顾客管理页

- `/admin/points`
  - 积分管理页

- `/admin/line`
  - LINE 会话页
  - 查看用户、未读消息、会话记录、发送消息、绑定顾客

- `/admin/settings`
  - 系统设置页
  - 管理时隙长度、自动取消时间、积分规则

## 3. 路由约束

- Public 路由默认不需要登录。
- Admin 路由需要管理员登录，未登录会重定向到 `/admin/login`。
- 登录后会保留 `next` 参数，返回原目标页面。
- `/admin/*` 和 `/api/admin/*` 都受 middleware 保护。

## 4. 语言规则

- 通过 URL query 使用 `?lang=zh|ja` 切换语言。
- 管理端页面之间会尽量保留 `lang` 参数。
- 当前默认中文和日文双语，不包含英文。

## 5. 与 LINE 相关的页面职责

- `/line/link` 负责顾客自助完成 LINE 绑定。
- `/line/manage` 负责顾客查看和解除自身绑定关系。
- 店长与顾客的 1 对 1 会话管理统一放在 `/admin/line`。
