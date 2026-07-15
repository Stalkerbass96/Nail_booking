# Frontend Routes V1

最后更新：2026-07-06

本文档记录当前前端页面路由，口径以 **2.0 LINE-first** 为准。

## 1. Public Routes

- `/`
  - 前台首页
  - 2.0 中为定额款式预约首页
  - 主要入口来自 LINE 欢迎消息里的链接

- `/booking`
  - 顾客预约页
  - 旧版兼容入口；当前主流程通常从 `/showcase/{id}` 或 `/services/{id}` 渲染预约表单
  - LINE 路径依赖 `entry`

- `/showcase/{id}`
  - 定额款式详情与预约页
  - 支持固定加项、可选加项、自定义价格和自定义时长

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
  - 支持 sticky 分类跳转和排序展示

- `/services/{id}`
  - 套餐详情与套餐预约页

- `/addons`
  - 公开加项目录页

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
  - 定额款式管理页
  - 维护定额款式图片、标题、分类、关联套餐、排序、上下架

- `/admin/appointments`
  - 预约管理页
  - 显示预约状态、顾客信息、定额款式来源、来源渠道

- `/admin/customers`
  - 顾客管理页
  - 显示潜在客户 / 正式顾客、LINE 档案、预约历史、积分

- `/admin/line`
  - LINE 会话页
  - 店长与顾客 1 对 1 文本沟通

- `/admin/schedule`
  - 排班管理页
  - 当前为基于 `DaySlot` 的拖拽排班日历，并管理封锁区间

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
- 线下扫码 -> LINE 加好友 -> 收到预约链接 -> menu 页面 `/services` -> 预约页 -> 待确认 / 已确认消息

### 店长侧

旧版重点：
- 套餐 / 预约 / 顾客 / 积分

2.0 新增重点：
- 定额款式管理
- 定额款式自定义价格/时长/加项组合
- LINE 1 对 1 会话
- 顾客潜客 / 正式客状态管理
- 预约来源追踪（定额款式项、LINE 导流）
- DaySlot 拖拽排班
