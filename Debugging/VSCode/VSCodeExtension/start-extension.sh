#!/bin/bash

# 启动ILRuntime扩展脚本

echo "🚀 启动ILRuntime扩展..."

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在扩展根目录运行此脚本"
    exit 1
fi

# 编译扩展
echo "🔨 编译扩展..."
npm run esbuild-base

if [ $? -eq 0 ]; then
    echo "✅ 编译成功"
else
    echo "❌ 编译失败"
    exit 1
fi

# 启动扩展
echo "🎯 启动扩展..."
code --extensionDevelopmentPath="$(pwd)" "$(pwd)/test-workspace"

echo "✅ 扩展已启动！"
echo ""
echo "📝 在新窗口中："
echo "1. 打开ILRuntime Demo项目"
echo "2. 测试扩展命令"
echo "3. 验证热更新功能"
