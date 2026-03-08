# Frontend Routes V1

最后更新：2026-03-08

本文档记录当前前端页面路由，口径以 **2.0 LINE-first** 为准。

## 1. Public Routes

- `/`
  - 前台首页
  - 2.0 中为图墙式预约首页
  - 主要入口来自 LINE 欢迎消息里的链接

- `/booking`
  - 顾客预约页
  - 通过图墙项进入
  - 主参数为 `showcaseItemId` 与 `entry`

- `/booking/success/{bookingNo}`
  - 预约提交成功页

- `/booking/{bookingNo}`
  - 预约详情页
  - 公开可访问
  - 作为 LINE 消息中附带的详情链接落点

- `/booking/lookup`
  - 旧版兼容页
  - 不再是 2.0 主路径

- `/services`
  - 兼容展示页
  - 当前不是 2.0 主入口

- `/services/{id}`
  - 兼容服务详情页
  - 当前不是 2.0 主入口

- `/line/link`
  - LINE 自助绑定页
  - 当前保留兼容

- `/line/manage`
  - 顾客查看 / 解除 LINE 绑定关系页
  - 当前保留兼容

## 2. Admin Routes

- `/admin/login`
  - 店长登录页

- `/admin`
  - 管理后台首页
  - 展示预约、顾客、LINE 等概览

- `/admin/showcase`
  - 图墙管理页
  - 维护图墙图片、标题、分类、关联套餐、排序、上下架

- `/admin/appointments`
  - 预约管理页
  - 显示预约状态、顾客信息、图墙来源、来源渠道

- `/admin/customers`
  - 顾客管理页
  - 显示潜在客户 / 正式顾客、LINE 档案、预约历史、积分

- `/admin/line`
  - LINE 会话页
  - 店长与顾客 1 对 1 文本沟通

- `/admin/schedule`
  - 排班管理页
  - 管理营业时间、特殊营业日、封锁区间

- `/admin/categories`
  - 分类管理页

- `/admin/packages`
  - 套餐管理页

- `/admin/addons`
  - 加项管理页

- `/admin/points`
  - 积分管理页

- `/admin/settings`
  - 系统设置页

## 3. 路由权限说明

- `Admin` 路由需要管理员登录，未登录会重定向到 `/admin/login`
- 登录后会保留 `next` 参数，返回原目标页面
- `/admin/*` 和 `/api/admin/*` 都受 middleware 保护

## 4. 2.0 版本里的入口变化

### 顾客侧

旧版主路径：
- 首页 -> 服务列表 -> 套餐详情 -> 预约

2.0 主路径：
- 线下扫码 -> LINE 加好友 -> 收到首页链接 -> 图墙首页 -> 预约页 -> 待确认 / 已确认消息

### 店长侧

旧版重点：
- 套餐 / 预约 / 顾客 / 积分

2.0 新增重点：
- 图墙管理
- LINE 1 对 1 会话
- 顾客潜客 / 正式客状态管理
- 预约来源追踪（图墙项、LINE 导流）
