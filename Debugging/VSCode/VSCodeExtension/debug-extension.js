#!/usr/bin/env node

/**
 * 扩展调试诊断脚本
 * 用于诊断扩展激活问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ILRuntime扩展调试诊断');
console.log('='.repeat(50));

// 1. 检查文件结构
console.log('\n📁 文件结构检查:');
const requiredFiles = [
    'dist/extension.js',
    'package.json',
    'src/extension.ts',
    '.vscode/launch.json',
    '.vscode/tasks.json'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
});

// 2. 检查package.json配置
console.log('\n⚙️  package.json配置检查:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // 检查main字段
    console.log(`✅ main: ${packageJson.main}`);
    
    // 检查激活事件
    const activationEvents = packageJson.activationEvents || [];
    console.log(`✅ 激活事件数量: ${activationEvents.length}`);
    
    // 检查命令配置
    const commands = packageJson.contributes?.commands || [];
    console.log(`✅ 命令数量: ${commands.length}`);
    
    // 检查关键激活事件
    const keyActivationEvents = [
        'onStartupFinished',
        'onCommand:extension.ilruntime-debug.hotReloadStatus',
        'onCommand:extension.ilruntime-debug.showILRuntimeStatus'
    ];
    
    keyActivationEvents.forEach(event => {
        const exists = activationEvents.includes(event);
        console.log(`${exists ? '✅' : '❌'} 激活事件: ${event}`);
    });
    
    // 检查关键命令
    const keyCommands = [
        'extension.ilruntime-debug.hotReloadStatus',
        'extension.ilruntime-debug.showILRuntimeStatus',
        'extension.ilruntime-debug.manualHotReload'
    ];
    
    keyCommands.forEach(cmd => {
        const exists = commands.some(c => c.command === cmd);
        console.log(`${exists ? '✅' : '❌'} 命令: ${cmd}`);
    });
    
} catch (error) {
    console.log(`❌ package.json解析失败: ${error.message}`);
}

// 3. 检查编译输出
console.log('\n🔨 编译输出检查:');
try {
    const stats = fs.statSync('dist/extension.js');
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`✅ 编译文件大小: ${sizeKB}KB`);
    
    // 检查文件内容是否包含关键函数
    const content = fs.readFileSync('dist/extension.js', 'utf8');
    const hasActivate = content.includes('activate');
    const hasCommands = content.includes('registerCommand');
    const hasHotReload = content.includes('hotReloadStatus');
    
    console.log(`${hasActivate ? '✅' : '❌'} 包含activate函数`);
    console.log(`${hasCommands ? '✅' : '❌'} 包含registerCommand`);
    console.log(`${hasHotReload ? '✅' : '❌'} 包含热更新功能`);
    
} catch (error) {
    console.log(`❌ 编译文件检查失败: ${error.message}`);
}

// 4. 检查VSCode配置
console.log('\n🎯 VSCode配置检查:');
const vscodeConfigs = [
    '.vscode/launch.json',
    '.vscode/tasks.json'
];

vscodeConfigs.forEach(config => {
    if (fs.existsSync(config)) {
        try {
            const configContent = JSON.parse(fs.readFileSync(config, 'utf8'));
            console.log(`✅ ${config} 配置有效`);
        } catch (error) {
            console.log(`❌ ${config} 配置无效: ${error.message}`);
        }
    } else {
        console.log(`❌ ${config} 不存在`);
    }
});

console.log('\n' + '='.repeat(50));
console.log('📝 诊断完成！');
console.log('\n🔧 如果扩展仍然不可用，请尝试:');
console.log('1. 按 F5 重新启动扩展调试模式');
console.log('2. 检查VSCode输出面板中的错误信息');
console.log('3. 确认扩展在新窗口中已激活');
console.log('4. 尝试在C#文件中使用命令（某些命令只在C#文件中可用）');
