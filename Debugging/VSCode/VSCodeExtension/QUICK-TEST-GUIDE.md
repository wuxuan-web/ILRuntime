# ILRuntime扩展快速测试指南

## 测试步骤

### 第一步：启动扩展主机

1. **在扩展开发VSCode中按 `F5`**
2. **选择 "启动扩展" 配置**
3. **等待新的VSCode窗口打开**

### 第二步：验证扩展激活

在新窗口中：

1. **打开输出面板**：`Cmd+Shift+U`
2. **选择 "ILRuntime Debug" 输出**
3. **应该看到以下信息**：
   ```
   🚀 ILRuntime扩展激活中...
   📁 工作区路径: /path/to/test-workspace
   ⚙️  ILRuntime配置: {...}
   🔧 尝试连接到Unity调试服务，端口: 56000
   ```

### 第三步：测试调试功能

1. **打开 `TestHotfix.cs` 文件**
2. **在代码中设置断点**，例如：
   ```csharp
   public void TestMethod()
   {
       int x = 10; // 在这里设置断点
       Debug.Log($"测试值: {x}");
   }
   ```
3. **按 `F5` 启动调试**
4. **选择 "Attach to ILRuntime (Unity)" 配置**

### 第四步：验证调试适配器

如果一切正常，应该看到：
```
🔧 创建ILRuntime调试适配器描述符...
📋 会话配置: {...}
🔍 配置的调试适配器路径: undefined
🔍 配置中未指定路径，尝试自动查找...
✅ 找到扩展根目录: /path/to/extension
✅ 找到调试适配器: /path/to/VSCodeDAILRuntime
✅ 调试适配器文件存在: /path/to/VSCodeDAILRuntime
🚀 启动调试适配器: /path/to/VSCodeDAILRuntime
```

## 故障排除

### 问题1：扩展没有激活
**解决方案**：
- 检查新窗口是否打开了test-workspace文件夹
- 查看输出面板是否有错误信息

### 问题2：找不到调试适配器
**解决方案**：
- 检查VSCodeDAILRuntime是否已编译
- 查看路径解析日志

### 问题3：无法连接到Unity
**解决方案**：
- 确保Unity项目正在运行
- 确保ILRuntime调试服务已启动
- 检查端口56000是否被占用

## 预期结果

成功时应该看到：
- 扩展激活日志
- 调试适配器启动成功
- 可以设置断点
- 调试会话建立成功
