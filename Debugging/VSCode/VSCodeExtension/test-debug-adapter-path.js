#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 测试调试适配器路径解析...\n');

// 模拟扩展运行时的路径
const currentDir = process.cwd();
const distDir = path.join(currentDir, 'dist');
const extensionRoot = path.dirname(currentDir);

console.log(`📁 当前目录: ${currentDir}`);
console.log(`📁 dist目录: ${distDir}`);
console.log(`📁 扩展根目录: ${extensionRoot}`);

// 测试各种路径解析方式
const testPaths = [
    // 方式1：从扩展根目录
    path.join(extensionRoot, 'VSCodeDAILRuntime', 'bin', 'Debug', 'net9.0', 'osx-arm64', 'VSCodeDAILRuntime'),
    
    // 方式2：从dist目录相对路径
    path.resolve(distDir, '../VSCodeDAILRuntime/bin/Debug/net9.0/osx-arm64/VSCodeDAILRuntime'),
    
    // 方式3：从当前目录相对路径
    path.resolve(currentDir, '../VSCodeDAILRuntime/bin/Debug/net9.0/osx-arm64/VSCodeDAILRuntime'),
    
    // 方式4：绝对路径
    '/Users/newuser/Project/ILRuntime/Debugging/VSCode/VSCodeDAILRuntime/bin/Debug/net9.0/osx-arm64/VSCodeDAILRuntime'
];

console.log('🔍 测试路径解析:');
testPaths.forEach((testPath, index) => {
    console.log(`\n路径 ${index + 1}: ${testPath}`);
    console.log(`  存在: ${fs.existsSync(testPath) ? '✅' : '❌'}`);
    
    if (fs.existsSync(testPath)) {
        const stats = fs.statSync(testPath);
        console.log(`  大小: ${stats.size} 字节`);
        console.log(`  权限: ${stats.mode.toString(8)}`);
        console.log(`  可执行: ${(stats.mode & 0o111) !== 0 ? '✅' : '❌'}`);
        
        // 测试执行
        try {
            const { execSync } = require('child_process');
            const result = execSync(`"${testPath}" --help`, { encoding: 'utf8', timeout: 5000 });
            console.log(`  执行测试: ✅ 成功`);
            console.log(`  输出: ${result.substring(0, 100)}...`);
        } catch (error) {
            console.log(`  执行测试: ❌ 失败 - ${error.message}`);
        }
    }
});

// 检查package.json中的配置
console.log('\n📋 检查package.json配置:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const debuggers = packageJson.contributes?.debuggers || [];
    
    debuggers.forEach((debuggerConfig, index) => {
        console.log(`\n调试器 ${index + 1}:`);
        console.log(`  类型: ${debuggerConfig.type}`);
        console.log(`  OSX程序: ${debuggerConfig.osx?.program || '未设置'}`);
        
        if (debuggerConfig.osx?.program) {
            const configuredPath = debuggerConfig.osx.program;
            const resolvedPath = path.resolve(currentDir, configuredPath);
            console.log(`  解析后路径: ${resolvedPath}`);
            console.log(`  存在: ${fs.existsSync(resolvedPath) ? '✅' : '❌'}`);
        }
    });
} catch (error) {
    console.error('❌ 读取package.json失败:', error.message);
}

console.log('\n🔍 路径测试完成！');
