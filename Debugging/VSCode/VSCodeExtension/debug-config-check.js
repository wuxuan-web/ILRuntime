#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 检查ILRuntime调试配置...\n');

// 检查package.json中的调试器配置
console.log('📋 检查package.json调试器配置:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const debuggers = packageJson.contributes?.debuggers || [];
    
    debuggers.forEach((debuggerConfig, index) => {
        console.log(`\n调试器 ${index + 1}:`);
        console.log(`  类型: ${debuggerConfig.type}`);
        console.log(`  标签: ${debuggerConfig.label}`);
        console.log(`  程序路径: ${debuggerConfig.program}`);
        console.log(`  运行时参数: ${debuggerConfig.runtimeArgs?.join(' ') || '无'}`);
        console.log(`  环境变量: ${JSON.stringify(debuggerConfig.env || {}, null, 2)}`);
    });
} catch (error) {
    console.error('❌ 读取package.json失败:', error.message);
}

// 检查调试适配器文件
console.log('\n📁 检查调试适配器文件:');
const debugAdapterPaths = [
    '../VSCodeDAILRuntime/bin/Debug/net9.0/osx-arm64/VSCodeDAILRuntime',
    '../VSCodeDAILRuntime/bin/Debug/net6.0/osx-arm64/VSCodeDAILRuntime',
    '../VSCodeDAILRuntime/bin/Release/net9.0/osx-arm64/VSCodeDAILRuntime',
    '../VSCodeDAILRuntime/bin/Release/net6.0/osx-arm64/VSCodeDAILRuntime'
];

debugAdapterPaths.forEach((relativePath, index) => {
    const fullPath = path.resolve(__dirname, relativePath);
    console.log(`\n路径 ${index + 1}: ${relativePath}`);
    console.log(`  完整路径: ${fullPath}`);
    
    if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(`  ✅ 文件存在`);
        console.log(`  大小: ${stats.size} 字节`);
        console.log(`  权限: ${stats.mode.toString(8)}`);
        console.log(`  可执行: ${(stats.mode & 0o111) !== 0 ? '是' : '否'}`);
        
        // 检查文件类型
        try {
            const { execSync } = require('child_process');
            const fileType = execSync(`file "${fullPath}"`, { encoding: 'utf8' });
            console.log(`  类型: ${fileType.trim()}`);
        } catch (error) {
            console.log(`  类型: 无法确定`);
        }
    } else {
        console.log(`  ❌ 文件不存在`);
    }
});

// 检查launch.json配置
console.log('\n⚙️  检查launch.json配置:');
const launchJsonPath = '.vscode/launch.json';
if (fs.existsSync(launchJsonPath)) {
    try {
        const launchJson = JSON.parse(fs.readFileSync(launchJsonPath, 'utf8'));
        console.log('✅ launch.json存在');
        
        launchJson.configurations?.forEach((config, index) => {
            console.log(`\n配置 ${index + 1}: ${config.name}`);
            console.log(`  类型: ${config.type}`);
            console.log(`  请求: ${config.request}`);
            console.log(`  程序: ${config.program || '未设置'}`);
            console.log(`  参数: ${config.args?.join(' ') || '无'}`);
            console.log(`  工作目录: ${config.cwd || '未设置'}`);
        });
    } catch (error) {
        console.error('❌ 解析launch.json失败:', error.message);
    }
} else {
    console.log('❌ launch.json不存在');
}

// 检查扩展编译输出
console.log('\n📦 检查扩展编译输出:');
const distPath = 'dist/extension.js';
if (fs.existsSync(distPath)) {
    const stats = fs.statSync(distPath);
    console.log(`✅ 扩展已编译`);
    console.log(`  大小: ${stats.size} 字节`);
    console.log(`  修改时间: ${stats.mtime}`);
} else {
    console.log('❌ 扩展未编译');
}

// 检查Unity调试服务
console.log('\n🎮 检查Unity调试服务:');
try {
    const { execSync } = require('child_process');
    const netstat = execSync('netstat -an | grep 56000', { encoding: 'utf8' });
    console.log('✅ 端口56000状态:');
    console.log(netstat);
} catch (error) {
    console.log('❌ 无法检查端口状态:', error.message);
}

console.log('\n🔍 配置检查完成！');
