# Data Model Change Draft V2.0

更新时间：2026-03-08

本文档描述从当前 1.x 版本升级到 2.0 LINE First 时，数据库模型和业务主键需要做的调整。

## 1. 设计目标

1. 顾客主身份从邮箱切换为 `LINE userId`。
2. 图墙成为新的前台展示入口。
3. 预约需要记录“顾客是从哪张图进入的”。
4. 保留当前预约、排班、积分主能力，不做破坏性下线。

## 2. Customer 模型调整

### 2.1 目标变化

当前顾客识别偏向邮箱；2.0 后应改为基于 LINE 身份沉淀顾客。

### 2.2 建议字段

- `id`
- `displayName`
- `name`：店长可维护的正式显示名，可为空
- `email`：可空，非唯一
- `customerType`
  - `lead`
  - `active`
- `firstBookedAt`：首次提交预约时间，可空
- `createdFrom`
  - `line`
  - `admin`
  - 预留其他来源
- `lineUserId`：与 `LineUser` 形成强关联
- `createdAt`
- `updatedAt`

### 2.3 约束建议

- `email` 不再使用唯一约束作为主识别规则
- `lineUserId` 业务上应唯一绑定一个顾客

## 3. LineUser 模型调整

### 3.1 当前定位

`LineUser` 当前偏会话和技术接入对象。

### 3.2 2.0 后定位

`LineUser` 继续保留为 LINE 技术身份载体，`Customer` 作为业务顾客实体。

### 3.3 建议保留字段

- `id`
- `lineUserId`（LINE 平台 userId）
- `displayName`
- `pictureUrl`
- `isFollowing`
- `followedAt`
- `lastSeenAt`
- `customerId`
- `createdAt`
- `updatedAt`

### 3.4 建议新增字段

- `welcomeSentAt`：是否已首次推送首页链接
- `lastHomeLinkSentAt`

## 4. ShowcaseItem 新模型

2.0 新增图墙展示模型。

### 4.1 目标

- 前台首页展示图墙
- 图墙项与套餐解耦，但可绑定套餐
- 多个图墙项可以指向同一套餐

### 4.2 建议字段

- `id`
- `title`
- `description`
- `imageUrl`
- `categoryId`
- `servicePackageId`
- `displayPriceJpy`
- `priceLabel`
- `sortOrder`
- `isPublished`
- `createdAt`
- `updatedAt`

### 4.3 约束

- 一个图墙项只能绑定一个套餐
- 一个套餐可以绑定多个图墙项

## 5. Appointment 模型调整

### 5.1 建议新增字段

- `showcaseItemId`：预约来源图墙项
- `sourceChannel`
  - `line_showcase`
  - 预留其他来源

### 5.2 继续保留

- `bookingNo`
- `customerId`
- `servicePackageId`
- `status`
- `startAt`
- `endAt`
- `note`

## 6. 分类模型的角色变化

当前分类主要服务套餐展示。

2.0 后分类同时服务：
- 套餐分类
- 图墙筛选

建议：
- 继续沿用当前 `Category`
- 图墙项直接关联 `categoryId`

## 7. 预约详情公开页的数据需求

预约详情页至少需要：
- 预约号
- 顾客显示名
- 图墙项标题
- 套餐名称
- 预约状态
- 到店时间
- 备注

因此建议：
- `Appointment` 能方便关联到 `Customer`、`ServicePackage`、`ShowcaseItem`

## 8. 迁移策略建议

### 8.1 兼容迁移

建议采用兼容升级，不做一次性破坏性替换：
1. 先新增 `customerType`、`firstBookedAt`、`showcaseItemId`、`welcomeSentAt` 等字段
2. 新增 `ShowcaseItem` 表
3. 保留旧的邮箱字段和旧查询逻辑一段时间
4. 完成前台切换后，再逐步下线邮箱驱动查询

### 8.2 数据回填建议

- 已有关联 LINE 的顾客：按是否有预约回填 `customerType`
- 仅有邮箱、没有 LINE 的旧顾客：
  - 可保留
  - 但前台 2.0 不再把他们作为主流程对象

## 9. API 影响面

会直接影响：
- `public packages / categories / booking` 相关接口
- 顾客查询接口
- LINE webhook 处理逻辑
- 后台预约列表与顾客列表
- 新增图墙管理接口

## 10. 建议新增枚举

- `CustomerType`
  - `lead`
  - `active`
- `AppointmentSourceChannel`
  - `line_showcase`
- `CustomerCreatedFrom`
  - `line`
  - `admin`
