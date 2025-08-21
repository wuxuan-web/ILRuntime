# Unity ILRuntime调试设置指南

## 调试流程说明

### 1. 启动顺序很重要！

```
1. 启动Unity项目 (包含ILRuntime调试服务)
2. 启动VSCode扩展
3. 连接到ILRuntime调试服务
4. 开始调试
```

### 2. Unity项目端配置

#### 2.1 确保ILRuntime调试服务已启用
在Unity项目中，ILRuntime调试服务应该：
- 在游戏启动时自动启动
- 通过UDP广播告知调试器位置
- 监听调试连接

#### 2.2 检查调试服务状态
在Unity控制台中应该看到类似信息：
```
ILRuntime Debug Service Started
Broadcasting on port: 56000
```

### 3. VSCode端配置

#### 3.1 启动扩展
1. 按 `F5` 启动扩展调试模式
2. 在新窗口中打开Unity项目文件夹

#### 3.2 连接到ILRuntime
1. 按 `F5` 或 `Ctrl+Shift+D` 打开调试面板
2. 选择 "Attach to ILRuntime" 配置
3. 点击开始调试按钮
4. 系统会提示输入地址，通常可以：
   - 直接按回车使用默认地址
   - 或输入 `localhost:56000`

### 4. 调试步骤

#### 4.1 设置断点
1. 在热更新C#文件中设置断点
2. 断点会自动同步到ILRuntime调试服务

#### 4.2 触发断点
1. 在Unity中执行会触发断点的代码
2. VSCode会在断点处暂停
3. 可以查看变量、调用栈等信息

### 5. 常见问题解决

#### 问题1：找不到ILRuntime程序
**原因**：Unity项目未启动或调试服务未启用
**解决**：
1. 确保Unity项目正在运行
2. 检查Unity控制台是否有调试服务启动信息
3. 确认ILRuntime插件已正确集成

#### 问题2：无法连接到调试服务
**原因**：网络或端口问题
**解决**：
1. 检查防火墙设置
2. 确认UDP端口56000未被占用
3. 尝试使用 `localhost:56000` 作为地址

#### 问题3：断点不工作
**原因**：热更新代码未重新编译
**解决**：
1. 重新编译热更新项目
2. 重新加载DLL到Unity
3. 重新设置断点

### 6. 测试检查清单

- [ ] Unity项目正在运行
- [ ] ILRuntime调试服务已启动
- [ ] VSCode扩展已激活
- [ ] 成功连接到ILRuntime调试服务
- [ ] 断点可以正常设置
- [ ] 断点可以正常触发

### 7. 调试命令

在VSCode中可以使用以下命令：
- `ILRuntime Debug: Show ILRuntime Status` - 显示调试状态
- `ILRuntime Debug: Show Hot Reload Status` - 显示热更新状态
- `ILRuntime Debug: Sync Breakpoints` - 同步断点
- `ILRuntime Debug: Manual Hot Reload` - 手动热更新
