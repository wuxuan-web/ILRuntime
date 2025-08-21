#!/bin/bash

echo "ILRuntime VSCode Extension 安装脚本"
echo "=================================="

# 查找VSCode应用
VSCODE_PATHS=(
    "/Applications/Visual Studio Code.app"
    "/Applications/Code.app"
    "$HOME/Downloads/Visual Studio Code.app"
    "$HOME/Downloads/Code.app"
    "$HOME/Desktop/Visual Studio Code.app"
    "$HOME/Desktop/Code.app"
)

VSCODE_PATH=""

for path in "${VSCODE_PATHS[@]}"; do
    if [ -d "$path" ]; then
        VSCODE_PATH="$path"
        echo "找到VSCode: $path"
        break
    fi
done

if [ -z "$VSCODE_PATH" ]; then
    echo "❌ 未找到VSCode应用，请手动指定VSCode路径"
    echo "请将VSCode应用移动到Applications文件夹，或者手动运行以下命令："
    echo ""
    echo "方法1: 手动安装命令行工具"
    echo "1. 打开VSCode"
    echo "2. 按 Cmd+Shift+P 打开命令面板"
    echo "3. 输入 'Shell Command: Install 'code' command in PATH'"
    echo "4. 选择并执行该命令"
    echo ""
    echo "方法2: 直接使用VSCode应用"
    echo "1. 打开VSCode"
    echo "2. 按 Cmd+Shift+P 打开命令面板"
    echo "3. 输入 'Extensions: Install from VSIX...'"
    echo "4. 选择本目录下的扩展文件"
    exit 1
fi

# 设置命令行工具
echo "🔧 设置VSCode命令行工具..."
"$VSCODE_PATH/Contents/Resources/app/bin/code" --install-extension .

if [ $? -eq 0 ]; then
    echo "✅ 扩展安装成功！"
    echo ""
    echo "使用方法："
    echo "1. 打开VSCode"
    echo "2. 按 F5 或点击调试按钮"
    echo "3. 选择 'Attach to ILRuntime' 配置"
    echo "4. 开始调试您的ILRuntime项目"
else
    echo "❌ 扩展安装失败"
    echo ""
    echo "请尝试手动安装："
    echo "1. 打开VSCode"
    echo "2. 按 Cmd+Shift+P 打开命令面板"
    echo "3. 输入 'Extensions: Install from VSIX...'"
    echo "4. 选择本目录下的扩展文件"
fi
