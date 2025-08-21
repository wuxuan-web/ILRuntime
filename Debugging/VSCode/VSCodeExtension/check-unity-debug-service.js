#!/usr/bin/env node

const net = require('net');

console.log('🔍 检查Unity ILRuntime调试服务...\n');

// 检查端口56000是否被占用
function checkPort(port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        
        socket.setTimeout(5000);
        
        socket.on('connect', () => {
            console.log(`✅ 端口 ${port} 正在监听`);
            socket.destroy();
            resolve(true);
        });
        
        socket.on('timeout', () => {
            console.log(`❌ 端口 ${port} 连接超时`);
            socket.destroy();
            resolve(false);
        });
        
        socket.on('error', (err) => {
            console.log(`❌ 端口 ${port} 连接失败: ${err.message}`);
            resolve(false);
        });
        
        socket.connect(port, 'localhost');
    });
}

// 检查进程信息
function checkProcesses() {
    const { execSync } = require('child_process');
    
    try {
        console.log('🔍 检查占用端口56000的进程:');
        const result = execSync('lsof -i :56000', { encoding: 'utf8' });
        console.log(result);
        
        // 检查Unity进程
        console.log('\n🔍 检查Unity进程:');
        const unityResult = execSync('ps aux | grep -i unity', { encoding: 'utf8' });
        console.log(unityResult);
        
    } catch (error) {
        console.log('❌ 无法检查进程信息:', error.message);
    }
}

// 主函数
async function main() {
    console.log('📋 检查步骤:');
    console.log('1. 检查端口56000是否被占用');
    console.log('2. 检查Unity进程是否运行');
    console.log('3. 检查网络连接');
    
    console.log('\n' + '='.repeat(50));
    
    // 检查端口
    const portOpen = await checkPort(56000);
    
    console.log('\n' + '='.repeat(50));
    
    // 检查进程
    checkProcesses();
    
    console.log('\n' + '='.repeat(50));
    
    // 总结
    console.log('\n📊 检查结果:');
    if (portOpen) {
        console.log('✅ 端口56000正在监听');
        console.log('💡 Unity ILRuntime调试服务可能已启动');
        console.log('💡 但版本检测可能有问题');
    } else {
        console.log('❌ 端口56000未监听');
        console.log('💡 Unity ILRuntime调试服务可能未启动');
        console.log('💡 请检查Unity项目是否正确启动了调试服务');
    }
    
    console.log('\n🔧 建议:');
    console.log('1. 确保Unity项目正在运行');
    console.log('2. 确保ILRuntime调试服务已启动');
    console.log('3. 检查Unity控制台是否有调试服务启动信息');
    console.log('4. 如果调试服务未启动，请手动启动');
}

main().catch(console.error);
