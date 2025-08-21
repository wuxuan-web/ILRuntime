# 快速安装指南

## 最简单的安装方法（推荐）

### 步骤1：打开VSCode扩展项目
1. 打开您的VSCode应用
2. 按 `Cmd+Shift+P` 打开命令面板
3. 输入 `Developer: Open Folder`
4. 选择以下路径：
   ```
   /Users/newuser/Project/ILRuntime/Debugging/VSCode/VSCodeExtension
   ```

### 步骤2：启动开发模式
1. 在VSCode中按 `F5` 键
2. 这将打开一个新的VSCode窗口（扩展开发主机）
3. 在新窗口中，扩展已经加载并可以使用

### 步骤3：测试扩展
1. 在新打开的VSCode窗口中
2. 按 `F5` 或点击调试按钮
3. 选择 `Attach to ILRuntime` 配置
4. 开始调试您的ILRuntime项目

## 验证安装

如果安装成功，您应该能看到：
- 调试配置中有 `Attach to ILRuntime` 选项
- 命令面板中有 `ILRuntime Debug` 相关命令
- 可以设置C#文件的断点

## 故障排除

如果遇到问题：
1. 检查VSCode版本（需要1.64.0+）
2. 查看开发者控制台的错误信息
3. 确保.NET 9.0已安装
4. 确保调试适配器路径正确

## 开发模式的优势

- 实时修改代码，按F5重新加载
- 可以调试扩展代码本身
- 不需要打包和安装
- 便于开发和测试
