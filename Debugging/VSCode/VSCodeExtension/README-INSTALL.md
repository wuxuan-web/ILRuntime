# ILRuntime VSCode 调试插件安装指南

## 前置条件
- macOS (支持 ARM64)
- VSCode 已安装
- .NET 9.0 运行时

## 安装方法

### 方法一：开发模式安装（推荐）

1. **打开VSCode**
2. **按 `Cmd+Shift+P` 打开命令面板**
3. **输入 `Developer: Open Folder` 并选择扩展目录**
   ```
   /Users/newuser/Project/ILRuntime/Debugging/VSCode/VSCodeExtension
   ```
4. **按 `F5` 启动调试模式**
5. **在新打开的VSCode窗口中测试扩展**

### 方法二：手动安装命令行工具

1. **打开VSCode**
2. **按 `Cmd+Shift+P` 打开命令面板**
3. **输入 `Shell Command: Install 'code' command in PATH`**
4. **选择并执行该命令**
5. **重启终端**
6. **运行安装脚本：**
   ```bash
   cd /Users/newuser/Project/ILRuntime/Debugging/VSCode/VSCodeExtension
   ./install-extension.sh
   ```

### 方法三：直接使用VSCode应用

1. **打开VSCode**
2. **按 `Cmd+Shift+P` 打开命令面板**
3. **输入 `Extensions: Install from VSIX...`**
4. **选择扩展文件（需要先打包）**

## 打包扩展

如果需要创建VSIX文件：

```bash
# 安装vsce工具
npm install -g @vscode/vsce

# 打包扩展
vsce package
```

## 使用方法

1. **打开您的ILRuntime项目**
2. **按 `F5` 或点击调试按钮**
3. **选择 `Attach to ILRuntime` 配置**
4. **开始调试**

## 故障排除

### 问题1：找不到VSCode
- 确保VSCode已正确安装
- 尝试将VSCode移动到Applications文件夹

### 问题2：调试适配器无法启动
- 确保.NET 9.0已安装
- 检查调试适配器路径是否正确

### 问题3：扩展无法加载
- 检查VSCode版本是否兼容（需要1.64.0+）
- 查看VSCode的开发者控制台错误信息

## 开发调试

在开发模式下：
1. 修改代码后按 `F5` 重新加载
2. 查看调试控制台输出
3. 使用断点调试扩展代码
