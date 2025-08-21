#!/usr/bin/env node

/**
 * 快速测试脚本
 * 用于验证ILRuntime扩展的基本功能
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ILRuntime扩展快速测试');
console.log('='.repeat(40));

// 检查关键文件
const keyFiles = [
    'dist/extension.js',
    'package.json',
    'src/extension.ts',
    'src/breakpointMapper.ts',
    'src/hotReloadManager.ts',
    'src/ilruntimeIntegration.ts'
];

console.log('\n📁 检查文件完整性:');
let allFilesExist = true;
keyFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
});

// 检查package.json配置
console.log('\n⚙️  检查配置:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const commands = packageJson.contributes?.commands || [];
    console.log(`✅ package.json 有效`);
    console.log(`✅ 配置了 ${commands.length} 个命令`);
    
    // 检查关键命令
    const keyCommands = [
        'extension.ilruntime-debug.hotReloadStatus',
        'extension.ilruntime-debug.manualHotReload',
        'extension.ilruntime-debug.showILRuntimeStatus'
    ];
    
    keyCommands.forEach(cmd => {
        const exists = commands.some(c => c.command === cmd);
        console.log(`${exists ? '✅' : '❌'} 命令: ${cmd}`);
    });
} catch (error) {
    console.log(`❌ package.json 解析失败: ${error.message}`);
}

// 检查编译输出
console.log('\n🔨 检查编译输出:');
try {
    const stats = fs.statSync('dist/extension.js');
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`✅ 编译文件存在 (${sizeKB}KB)`);
    
    if (sizeKB > 100) {
        console.log('✅ 文件大小合理');
    } else {
        console.log('⚠️  文件可能过小，检查编译是否完整');
    }
} catch (error) {
    console.log(`❌ 编译文件不存在: ${error.message}`);
}

console.log('\n' + '='.repeat(40));
if (allFilesExist) {
    console.log('🎉 扩展准备就绪！');
    console.log('\n📝 下一步:');
    console.log('1. 在VSCode中按 F5 启动扩展调试模式');
    console.log('2. 在新窗口中打开 test-workspace 文件夹');
    console.log('3. 测试各种命令功能');
} else {
    console.log('⚠️  扩展存在问题，请检查上述错误');
}
