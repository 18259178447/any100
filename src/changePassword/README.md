# AnyRouter 账号密码修改工具

此模块用于修改 AnyRouter 账号的用户名和密码。

## 功能特性

- 支持修改用户名
- 支持修改密码
- 支持同时修改用户名和密码
- 支持批量修改多个账号
- 自动验证修改结果
- 使用 Playwright 浏览器自动化，带反检测功能

## 使用方法

### 单个账号修改

```javascript
import AnyRouterChangePassword from './change-password.js';

const changer = new AnyRouterChangePassword();

// 只修改密码
const result = await changer.changePassword(
  'username',           // 原用户名
  'oldPassword',        // 原密码
  null,                 // 新用户名（null 表示不修改）
  'newPassword'         // 新密码
);

// 只修改用户名
const result = await changer.changePassword(
  'oldUsername',        // 原用户名
  'password',           // 密码
  'newUsername',        // 新用户名
  null                  // 新密码（null 表示不修改）
);

// 同时修改用户名和密码
const result = await changer.changePassword(
  'oldUsername',        // 原用户名
  'oldPassword',        // 原密码
  'newUsername',        // 新用户名
  'newPassword'         // 新密码
);

if (result.success) {
  console.log('修改成功！');
  console.log('用户信息:', result.userInfo);
} else {
  console.log('修改失败:', result.message);
}
```

### 批量修改

```javascript
import AnyRouterChangePassword from './change-password.js';

const changer = new AnyRouterChangePassword();

const accounts = [
  {
    username: 'user1',
    oldPassword: 'oldPass1',
    newUsername: 'newUser1',  // 可选
    newPassword: 'newPass1'   // 可选
  },
  {
    username: 'user2',
    oldPassword: 'oldPass2',
    newPassword: 'newPass2'   // 只修改密码
  },
  {
    username: 'user3',
    oldPassword: 'oldPass3',
    newUsername: 'newUser3'   // 只修改用户名
  }
];

const results = await changer.batchChangePassword(accounts);

results.forEach((result, index) => {
  console.log(`账号 ${index + 1}: ${result.success ? '成功' : '失败'}`);
  console.log(`消息: ${result.message}`);
});
```

### 命令行直接运行

编辑 `change-password.js` 文件末尾的测试代码：

```javascript
const username = 'your_username';        // 原用户名
const oldPassword = 'your_old_password'; // 原密码
const newUsername = null;                // 新用户名（null 表示不修改）
const newPassword = 'your_new_password'; // 新密码
```

然后运行：

```bash
node src/changePassword/change-password.js
```

## 返回值说明

### 单个账号修改返回值

```javascript
{
  success: true/false,      // 是否成功
  message: '...',           // 结果消息
  userInfo: {               // 用户信息（成功时返回）
    id: 12345,
    username: 'newUsername',
    email: 'user@example.com',
    quota: 50000000,        // 余额（单位：内部单位，除以 500000 得到美元）
    used_quota: 1000000,    // 已使用额度
    aff_code: 'ABC123'      // 推广码
  }
}
```

### 批量修改返回值

```javascript
[
  {
    originalUsername: 'user1',     // 原用户名
    newUsername: 'newUser1',       // 新用户名
    success: true,                 // 是否成功
    message: '账号信息修改成功',   // 结果消息
    userInfo: { ... }              // 用户信息
  },
  // ...
]
```

## 注意事项

1. **密码策略**: 确保新密码符合 AnyRouter 的密码要求
2. **用户名唯一性**: 新用户名必须在平台上未被使用
3. **操作频率**: 批量修改时，账号之间会有 5-7 秒的延迟，避免触发平台限制
4. **原密码验证**: 修改时必须提供正确的原密码
5. **至少修改一项**: 新用户名和新密码至少需要提供一个

## 工作流程

1. 启动 Chromium 浏览器（带反检测）
2. 访问 AnyRouter 首页
3. 使用原用户名和密码登录
4. 调用 PUT `/api/user/self` 接口修改账号信息
5. 调用 GET `/api/user/self` 接口验证修改结果
6. 返回修改结果和最新的用户信息
7. 关闭浏览器

## API 接口说明

### 修改账号信息

```
PUT /api/user/self
Headers:
  Content-Type: application/json
  New-Api-User: {user_id}
Body:
  {
    "original_password": "旧密码",
    "password": "新密码（可选）",
    "username": "新用户名（可选）"
  }
```

### 获取用户信息

```
GET /api/user/self
Headers:
  Content-Type: application/json
  New-Api-User: {user_id}
```

## 错误处理

所有可能的错误都会被捕获并返回，包括：

- 登录失败
- 原密码错误
- 新用户名已被占用
- 网络请求失败
- 浏览器操作异常

错误信息会在返回值的 `message` 字段中说明。
