#!/usr/bin/env node

/**
 * 网络诊断脚本
 * 用于检查ILRuntime调试服务的UDP广播
 */

const dgram = require('dgram');
const socket = dgram.createSocket('udp4');

console.log('🔍 开始监听ILRuntime调试服务UDP广播...');
console.log('='.repeat(50));

// 监听UDP广播
socket.on('message', (msg, rinfo) => {
    console.log(`📡 收到UDP消息来自: ${rinfo.address}:${rinfo.port}`);
    console.log(`📦 消息长度: ${msg.length} 字节`);
    
    try {
        // 尝试解析消息内容
        const message = msg.toString('utf8');
        console.log(`📄 消息内容: ${message}`);
        
        // 如果是JSON格式，尝试解析
        try {
            const jsonData = JSON.parse(message);
            console.log('✅ JSON解析成功:', jsonData);
        } catch (e) {
            console.log('⚠️  不是JSON格式，显示原始数据');
        }
    } catch (e) {
        console.log('⚠️  无法解析消息内容');
    }
    
    console.log('-' .repeat(30));
});

socket.on('error', (err) => {
    console.error('❌ UDP监听错误:', err);
});

socket.on('listening', () => {
    const address = socket.address();
    console.log(`🎯 开始监听UDP端口: ${address.port}`);
    console.log(`📍 监听地址: ${address.address}`);
});

// 绑定到默认端口56000
const PORT = 56000;
socket.bind(PORT, () => {
    console.log(`🚀 开始监听端口 ${PORT}...`);
    console.log('⏳ 等待ILRuntime调试服务广播...');
    console.log('');
    console.log('📝 请确保Unity项目正在运行，并且ILRuntime调试服务已启动');
    console.log('📝 按 Ctrl+C 停止监听');
});

// 设置超时
setTimeout(() => {
    console.log('');
    console.log('⏰ 30秒内未收到广播消息');
    console.log('🔧 可能的问题:');
    console.log('1. Unity项目未运行');
    console.log('2. ILRuntime调试服务未启动');
    console.log('3. 端口配置不正确');
    console.log('4. 防火墙阻止了UDP通信');
    console.log('');
    console.log('💡 建议检查:');
    console.log('- Unity控制台是否有调试服务启动信息');
    console.log('- 调试端口是否正确配置为56000');
    console.log('- 网络连接是否正常');
}, 30000);
