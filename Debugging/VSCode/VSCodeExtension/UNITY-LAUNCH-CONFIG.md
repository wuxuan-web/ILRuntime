# Unity项目ILRuntime调试配置指南

## 在你的Unity项目中配置launch.json

### 步骤1：创建.vscode文件夹
在你的Unity项目根目录下创建`.vscode`文件夹：
```bash
mkdir .vscode
```

### 步骤2：创建launch.json文件
在`.vscode`文件夹中创建`launch.json`文件，内容如下：

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Attach to ILRuntime (Unity)",
            "type": "ilruntime",
            "request": "launch",
            "address": "localhost:56000",
            "debug": true,
            "stopOnEntry": false,
            "trace": true,
            "cwd": "${workspaceFolder}",
            "env": {
                "ILRUNTIME_DEBUG": "1"
            }
        },
        {
            "name": "Debug Hotfix Assembly",
            "type": "ilruntime",
            "request": "launch",
            "address": "localhost:56000",
            "debug": true,
            "stopOnEntry": false,
            "trace": true,
            "cwd": "${workspaceFolder}",
            "program": "${workspaceFolder}/Assets/StreamingAssets/HotfixAOT.dll",
            "args": []
        },
        {
            "name": "Auto Attach to ILRuntime",
            "type": "ilruntime",
            "request": "launch",
            "address": "${command:AskForAddress}",
            "debug": true,
            "stopOnEntry": false,
            "trace": true,
            "cwd": "${workspaceFolder}"
        }
    ]
}
```

### 步骤3：配置说明

#### 配置项解释：

1. **`name`**: 调试配置的名称，会在VSCode调试面板中显示
2. **`type`**: 调试器类型，必须是`ilruntime`
3. **`request`**: 请求类型，使用`launch`进行启动调试
4. **`address`**: ILRuntime调试服务的地址
   - `localhost:56000`: 直接连接到本地Unity调试服务
   - `${command:AskForAddress}`: 弹出对话框让用户选择地址
5. **`debug`**: 是否启用调试模式
6. **`stopOnEntry`**: 是否在程序入口点停止
7. **`trace`**: 是否启用调试协议跟踪
8. **`cwd`**: 工作目录
9. **`program`**: 要调试的程序集路径（可选）
10. **`env`**: 环境变量

### 步骤4：根据你的项目结构调整

#### 如果你的热更新DLL在StreamingAssets中：
```json
{
    "name": "Debug Hotfix DLL",
    "type": "ilruntime",
    "request": "launch",
    "address": "localhost:56000",
    "program": "${workspaceFolder}/Assets/StreamingAssets/HotfixAOT.dll"
}
```

#### 如果你的热更新DLL在其他位置：
```json
{
    "name": "Debug Custom Hotfix",
    "type": "ilruntime",
    "request": "launch",
    "address": "localhost:56000",
    "program": "${workspaceFolder}/YourCustomPath/Hotfix.dll"
}
```

#### 如果你需要调试多个程序集：
```json
{
    "name": "Debug Multiple Assemblies",
    "type": "ilruntime",
    "request": "launch",
    "address": "localhost:56000",
    "program": "${workspaceFolder}/Assets/StreamingAssets/HotfixAOT.dll",
    "args": [
        "${workspaceFolder}/Assets/StreamingAssets/AnotherHotfix.dll"
    ]
}
```

### 步骤5：使用步骤

1. **启动Unity项目**，确保ILRuntime调试服务已启动
2. **在VSCode中打开Unity项目文件夹**
3. **按F5或点击调试按钮**
4. **选择对应的调试配置**
5. **在热更新C#文件中设置断点**
6. **在Unity中触发断点**

### 步骤6：故障排除

#### 如果出现"Cannot find a program to debug"：
1. 检查Unity是否正在运行
2. 检查ILRuntime调试服务是否启动（端口56000）
3. 检查VSCode扩展是否正确安装
4. 查看VSCode输出面板的调试信息

#### 如果无法连接：
1. 确认端口56000没有被其他程序占用
2. 检查防火墙设置
3. 尝试使用`127.0.0.1:56000`替代`localhost:56000`

#### 如果断点不工作：
1. 确保热更新DLL已正确加载
2. 检查断点是否设置在正确的文件中
3. 确认代码路径与Unity中运行的代码一致

### 步骤7：高级配置

#### 启用详细日志：
```json
{
    "name": "Debug with Verbose Logging",
    "type": "ilruntime",
    "request": "launch",
    "address": "localhost:56000",
    "trace": true,
    "env": {
        "ILRUNTIME_DEBUG": "1",
        "ILRUNTIME_TRACE": "1"
    }
}
```

#### 自定义调试端口：
```json
{
    "name": "Custom Port Debug",
    "type": "ilruntime",
    "request": "launch",
    "address": "localhost:56001",
    "debug": true
}
```

## 注意事项

1. **确保Unity项目正在运行**，ILRuntime调试服务已启动
2. **VSCode扩展必须正确安装**并激活
3. **端口56000必须可用**，不被其他程序占用
4. **热更新DLL路径必须正确**，与Unity中加载的路径一致
5. **断点必须设置在正确的文件中**，与Unity中运行的代码对应
