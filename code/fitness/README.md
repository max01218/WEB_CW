# 健身管理系统

这是一个基于 Next.js 和 Firebase 开发的健身管理系统，提供会员管理、预约训练、训练记录和通知等功能。

## 主要功能

### 1. 会员管理
- 会员注册和登录
- 个人信息管理
- 会员权限控制

### 2. 预约管理
- 在线预约训练课程
- 查看和管理预约记录
- 取消预约功能
- 预约状态追踪

### 3. 训练记录
- 记录训练时长和内容
- 查看历史训练记录
- 训练数据统计

### 4. 通知系统
- 实时通知提醒
- 未读消息提醒
- 通知状态管理
- 支持多种通知类型（预约、训练、系统通知）

## 最近更新

### 1. 通知系统优化
- 添加了未读通知计数功能
- 实现了通知标记已读功能
- 优化了通知显示界面
- 添加了通知徽标显示

### 2. 仪表盘界面升级
- 全新的渐变背景设计
- 添加了毛玻璃效果
- 优化了卡片布局和阴影效果
- 增加了动态数据展示
- 改进了用户信息区域的设计
- 添加了统计卡片的视觉优化
- 优化了导航卡片的交互效果

### 3. 数据展示优化
- 实时显示未读通知数量
- 训练时长统计展示
- 预约状态可视化
- 完成训练次数统计

## 技术栈

- 前端框架：Next.js
- UI 组件库：Ant Design
- 数据库：Firebase Firestore
- 认证服务：Firebase Authentication
- 样式：CSS-in-JS

## 开发环境设置

1. 克隆项目
```bash
git clone [项目地址]
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建 `.env.local` 文件并添加必要的 Firebase 配置

4. 运行开发服务器
```bash
npm run dev
```

##  Firestore-members 字段

字段名 | 类型 | 描述
uid | string | Firebase 自动生成的用户 ID
name | string | 用户填写
birthdate | string/date | 用户填写
address | string | 用户填写
email | string | 用户填写
role | string | 默认为 'member'
status | string | 默认为 'active'
createdAt | timestamp | 当前时间
updatedAt | timestamp | 当前时间

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目。

## 许可证

MIT License
