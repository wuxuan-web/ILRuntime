#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 ILRuntime版本兼容性检查...\n');

// 检查ILRuntime版本信息
function checkILRuntimeVersion() {
    console.log('📋 检查ILRuntime版本信息:');
    
    // 检查当前项目的ILRuntime版本
    const readmePath = path.join(__dirname, '../../ReadMe.md');
    if (fs.existsSync(readmePath)) {
        const content = fs.readFileSync(readmePath, 'utf8');
        const versionMatch = content.match(/release-v([\d.]+)/);
        if (versionMatch) {
            console.log(`✅ 当前ILRuntime版本: ${versionMatch[1]}`);
        }
    }
    
    // 检查VSCodeDAILRuntime的依赖
    const debugAdapterPath = path.join(__dirname, '../VSCodeDAILRuntime/bin/Debug/net9.0/osx-arm64/ILRuntime.dll');
    if (fs.existsSync(debugAdapterPath)) {
        console.log(`✅ VSCodeDAILRuntime包含ILRuntime.dll`);
        const stats = fs.statSync(debugAdapterPath);
        console.log(`   文件大小: ${stats.size} 字节`);
        console.log(`   修改时间: ${stats.mtime}`);
    } else {
        console.log(`❌ VSCodeDAILRuntime中未找到ILRuntime.dll`);
    }
}

// 检查Unity项目中的ILRuntime版本
function checkUnityILRuntimeVersion() {
    console.log('\n🎮 检查Unity项目中的ILRuntime版本:');
    
    // 常见的Unity ILRuntime路径
    const possiblePaths = [
        '/Users/newuser/Project/bingo-2-client/Unity/Assets/Plugins/ILRuntime.dll',
        '/Users/newuser/Project/bingo-2-client/Unity/Assets/Plugins/ILRuntime/ILRuntime.dll',
        '/Users/newuser/Project/bingo-2-client/Unity/Assets/StreamingAssets/ILRuntime.dll'
    ];
    
    let found = false;
    for (const unityPath of possiblePaths) {
        if (fs.existsSync(unityPath)) {
            console.log(`✅ 找到Unity ILRuntime: ${unityPath}`);
            const stats = fs.statSync(unityPath);
            console.log(`   文件大小: ${stats.size} 字节`);
            console.log(`   修改时间: ${stats.mtime}`);
            found = true;
        }
    }
    
    if (!found) {
        console.log('❌ 未找到Unity项目中的ILRuntime.dll');
        console.log('💡 请检查Unity项目中的ILRuntime路径');
    }
}

// 检查版本兼容性
function checkCompatibility() {
    console.log('\n🔧 版本兼容性建议:');
    
    console.log('1. **确保版本匹配**:');
    console.log('   - VSCodeDAILRuntime使用的ILRuntime版本');
    console.log('   - Unity项目使用的ILRuntime版本');
    console.log('   - 两者必须完全一致');
    
    console.log('\n2. **下载对应版本**:');
    console.log('   - 如果Unity使用ILRuntime 2.1.0');
    console.log('   - 需要下载ILRuntime 2.1.0的源码');
    console.log('   - 重新编译VSCodeDAILRuntime');
    
    console.log('\n3. **检查调试协议**:');
    console.log('   - 确保调试协议版本兼容');
    console.log('   - 确保调试服务正确启动');
    
    console.log('\n4. **推荐做法**:');
    console.log('   - 使用Unity项目中的ILRuntime源码');
    console.log('   - 重新编译VSCodeDAILRuntime');
    console.log('   - 确保所有组件版本一致');
}

// 生成版本匹配指南
function generateVersionGuide() {
    console.log('\n📖 版本匹配指南:');
    
    const guide = `
# ILRuntime版本匹配指南

## 问题描述
VSCodeDAILRuntime和Unity端的ILRuntime版本不匹配会导致调试失败。

## 解决方案

### 方案1：使用Unity项目中的ILRuntime源码

1. **找到Unity项目中的ILRuntime源码**
   - 通常在 \`Assets/Plugins/ILRuntime/\` 目录
   - 或者从ILRuntime官方仓库下载对应版本

2. **替换VSCodeDAILRuntime的依赖**
   - 将Unity项目中的ILRuntime.dll复制到VSCodeDAILRuntime
   - 或者重新编译VSCodeDAILRuntime使用相同版本的ILRuntime

3. **重新编译VSCodeDAILRuntime**
   \`\`\`bash
   cd Debugging/VSCode/VSCodeDAILRuntime
   dotnet clean
   dotnet build
   \`\`\`

### 方案2：下载对应版本的ILRuntime

1. **确定Unity使用的ILRuntime版本**
   - 查看Unity项目中的ILRuntime.dll版本
   - 或者查看Unity项目的依赖配置

2. **下载对应版本**
   - 访问 https://github.com/Ourpalm/ILRuntime/releases
   - 下载对应版本的源码

3. **重新编译整个项目**
   - 使用下载的ILRuntime源码
   - 重新编译VSCodeDAILRuntime

### 方案3：检查Unity项目配置

1. **确认ILRuntime版本**
   - 在Unity中查看ILRuntime版本信息
   - 确保使用最新稳定版本

2. **更新Unity项目**
   - 如果Unity项目使用旧版本，考虑升级
   - 确保调试服务正确启动

## 验证步骤

1. **检查版本一致性**
   - VSCodeDAILRuntime中的ILRuntime版本
   - Unity项目中的ILRuntime版本
   - 两者必须完全一致

2. **测试调试功能**
   - 启动Unity项目
   - 启动VSCode扩展
   - 尝试连接调试

3. **查看调试信息**
   - 检查版本匹配信息
   - 确认调试协议兼容
`;
    
    console.log(guide);
}

// 主函数
function main() {
    checkILRuntimeVersion();
    checkUnityILRuntimeVersion();
    checkCompatibility();
    generateVersionGuide();
}

main();
