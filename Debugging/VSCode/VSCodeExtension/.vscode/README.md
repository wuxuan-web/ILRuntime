# ILRuntime调试配置

## 使用方法

1. **启动Unity项目**，确保ILRuntime调试服务已启动
2. **在VSCode中打开此项目**
3. **按F5或点击调试按钮**
4. **选择对应的调试配置**：
   - "Attach to ILRuntime (Unity)": 直接连接到Unity调试服务
   - "Auto Attach to ILRuntime": 弹出对话框选择地址
   
5. **在热更新C#文件中设置断点**
6. **在Unity中触发断点**

## 故障排除

- 确保Unity项目正在运行
- 确保ILRuntime调试服务已启动（端口56000）
- 确保VSCode ILRuntime扩展已安装
- 查看VSCode输出面板的调试信息

## 配置说明

- `address`: ILRuntime调试服务地址
- `debug`: 启用调试模式
- `trace`: 启用调试协议跟踪
- `cwd`: 工作目录

