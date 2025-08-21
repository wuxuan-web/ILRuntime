# Unity ILRuntime版本检查指南

## 问题描述

出现错误：`ILRuntime Debugger version mismatch Expected version:4 Actual version:2`

这表明：
- VSCode扩展期望的调试协议版本：4
- Unity端返回的调试协议版本：2

## 原因分析

Unity项目中使用的ILRuntime版本较旧，不支持新版本的调试协议。

## 解决方案

### 方案1：升级Unity端的ILRuntime版本

1. **检查当前ILRuntime版本**
   - 在Unity项目中找到ILRuntime DLL
   - 查看版本信息

2. **升级到最新版本**
   - 下载最新版本的ILRuntime
   - 替换Unity项目中的ILRuntime DLL
   - 重新编译Unity项目

### 方案2：降级VSCode扩展的协议版本

如果无法升级Unity端，可以修改VSCode扩展以支持旧版本协议。

### 方案3：检查Unity项目配置

1. **确认ILRuntime调试服务已正确启动**
2. **检查调试服务版本**

## 检查步骤

### 1. 检查Unity控制台输出

在Unity中运行项目，查看控制台是否有以下信息：
```
ILRuntime Debugger Server Started
Version: 4
```

### 2. 检查ILRuntime DLL版本

在Unity项目中找到ILRuntime DLL文件，查看版本信息。

### 3. 检查调试服务启动代码

确保Unity项目中正确启动了调试服务：
```csharp
DebugService.StartDebugService(56000);
```

## 临时解决方案

如果暂时无法升级，可以：

1. **使用旧版本的VSCode扩展**
2. **或者修改扩展以支持版本2协议**

## 推荐做法

1. **升级Unity端的ILRuntime到最新版本**
2. **确保调试服务正确启动**
3. **重新测试调试功能**
