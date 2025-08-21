#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 快速配置ILRuntime调试环境...\n');

// 获取当前工作目录
const currentDir = process.cwd();
console.log(`📁 当前目录: ${currentDir}`);

// 检查是否是Unity项目
const isUnityProject = fs.existsSync(path.join(currentDir, 'Assets')) || 
                      fs.existsSync(path.join(currentDir, 'ProjectSettings')) ||
                      fs.existsSync(path.join(currentDir, 'Packages'));

if (isUnityProject) {
    console.log('✅ 检测到Unity项目');
} else {
    console.log('⚠️  未检测到Unity项目结构，将创建通用配置');
}

// 创建.vscode目录
const vscodeDir = path.join(currentDir, '.vscode');
if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir, { recursive: true });
    console.log('📁 创建.vscode目录');
} else {
    console.log('📁 .vscode目录已存在');
}

// 查找热更新DLL
let hotfixDllPath = '';
const possibleHotfixPaths = [
    'Assets/StreamingAssets/HotfixAOT.dll',
    'Assets/StreamingAssets/Hotfix.dll',
    'HotfixAOT/bin/Debug/net9.0/HotfixAOT.dll',
    'Hotfix/bin/Debug/net9.0/Hotfix.dll',
    'Assets/Plugins/HotfixAOT.dll',
    'Assets/Plugins/Hotfix.dll'
];

console.log('🔍 查找热更新DLL...');
for (const relativePath of possibleHotfixPaths) {
    const fullPath = path.join(currentDir, relativePath);
    if (fs.existsSync(fullPath)) {
        hotfixDllPath = relativePath;
        console.log(`✅ 找到热更新DLL: ${relativePath}`);
        break;
    }
}

if (!hotfixDllPath) {
    console.log('⚠️  未找到热更新DLL，将使用通用配置');
}

// 创建launch.json配置
const launchConfig = {
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
};

// 如果找到了热更新DLL，添加专门的配置
if (hotfixDllPath) {
    launchConfig.configurations.push({
        "name": "Debug Hotfix Assembly",
        "type": "ilruntime",
        "request": "launch",
        "address": "localhost:56000",
        "debug": true,
        "stopOnEntry": false,
        "trace": true,
        "cwd": "${workspaceFolder}",
        "program": `\${workspaceFolder}/${hotfixDllPath}`,
        "args": []
    });
}

// 写入launch.json文件
const launchJsonPath = path.join(vscodeDir, 'launch.json');
fs.writeFileSync(launchJsonPath, JSON.stringify(launchConfig, null, 2));

console.log('✅ 已创建launch.json配置文件');
console.log(`📄 配置文件路径: ${launchJsonPath}`);

// 显示配置内容
console.log('\n📋 配置内容:');
console.log(JSON.stringify(launchConfig, null, 2));

// 创建使用说明
const readmePath = path.join(vscodeDir, 'README.md');
const readmeContent = `# ILRuntime调试配置

## 使用方法

1. **启动Unity项目**，确保ILRuntime调试服务已启动
2. **在VSCode中打开此项目**
3. **按F5或点击调试按钮**
4. **选择对应的调试配置**：
   - "Attach to ILRuntime (Unity)": 直接连接到Unity调试服务
   - "Auto Attach to ILRuntime": 弹出对话框选择地址
   ${hotfixDllPath ? '- "Debug Hotfix Assembly": 调试特定的热更新程序集' : ''}
5. **在热更新C#文件中设置断点**
6. **在Unity中触发断点**

## 故障排除

- 确保Unity项目正在运行
- 确保ILRuntime调试服务已启动（端口56000）
- 确保VSCode ILRuntime扩展已安装
- 查看VSCode输出面板的调试信息

## 配置说明

- \`address\`: ILRuntime调试服务地址
- \`debug\`: 启用调试模式
- \`trace\`: 启用调试协议跟踪
- \`cwd\`: 工作目录
${hotfixDllPath ? `- \`program\`: 热更新程序集路径 (${hotfixDllPath})` : ''}
`;

fs.writeFileSync(readmePath, readmeContent);
console.log('📖 已创建使用说明');

console.log('\n🎉 配置完成！');
console.log('\n📝 下一步：');
console.log('1. 启动Unity项目');
console.log('2. 在VSCode中按F5开始调试');
console.log('3. 选择"Attach to ILRuntime (Unity)"配置');
console.log('4. 在热更新代码中设置断点');
