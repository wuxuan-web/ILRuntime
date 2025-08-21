#!/bin/bash

# 编译热更新DLL脚本

echo "🔨 开始编译热更新DLL..."

# 检查.NET环境
if ! command -v dotnet &> /dev/null; then
    echo "❌ 未找到dotnet命令，请安装.NET SDK"
    exit 1
fi

# 进入HotfixAOT目录
cd HotfixAOT

# 清理之前的编译
echo "🧹 清理之前的编译..."
dotnet clean

# 还原包
echo "📦 还原NuGet包..."
dotnet restore

# 编译项目
echo "🔨 编译项目..."
dotnet build -c Release

# 检查编译结果
if [ $? -eq 0 ]; then
    echo "✅ 编译成功！"
    
    # 检查DLL文件
    DLL_PATH="bin/Release/net9.0/HotfixAOT.dll"
    if [ -f "$DLL_PATH" ]; then
        echo "📁 DLL文件位置: $DLL_PATH"
        
        # 创建Unity项目目录结构
        mkdir -p ../UnityProject/Assets/StreamingAssets
        
        # 复制DLL到Unity项目
        cp "$DLL_PATH" ../UnityProject/Assets/StreamingAssets/
        echo "📋 DLL已复制到Unity项目"
        
        # 显示文件信息
        ls -la "$DLL_PATH"
        ls -la ../UnityProject/Assets/StreamingAssets/
        
    else
        echo "❌ 未找到编译后的DLL文件"
        exit 1
    fi
else
    echo "❌ 编译失败！"
    exit 1
fi

echo "🎉 热更新DLL编译完成！"
echo ""
echo "📝 下一步："
echo "1. 在Unity中打开UnityProject文件夹"
echo "2. 将HotfixManager脚本添加到场景中的GameObject"
echo "3. 运行Unity项目测试热更新功能"
