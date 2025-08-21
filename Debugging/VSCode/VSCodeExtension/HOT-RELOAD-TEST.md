# 热更新断点功能测试指南

## 功能概述

已实现的热更新断点功能包括：

### ✅ 已完成功能

1. **断点映射系统**
   - 断点位置追踪和ID管理
   - 文件变更监控
   - 断点重定位算法
   - 断点状态持久化

2. **热更新管理器**
   - 自动文件监控
   - 热更新状态管理
   - 状态栏显示
   - 事件通知系统

3. **调试协议扩展**
   - 自定义调试命令支持
   - 断点状态验证和重定位
   - 热更新状态查询
   - 断点列表管理

4. **断点持久化管理**
   - 断点配置保存和加载
   - 断点配置导入导出
   - 自动备份和恢复
   - 版本兼容性管理

5. **ILRuntime集成**
   - 补丁文件生成和应用
   - 程序集分析和类型提取
   - 补丁历史管理
   - 补丁文件清理

6. **VSCode集成**
   - 热更新相关命令
   - 状态栏指示器
   - 用户通知系统
   - 错误处理

## 测试步骤

### 1. 启动开发模式
1. 打开VSCode
2. 按 `Cmd+Shift+P` 打开命令面板
3. 输入 `Developer: Open Folder`
4. 选择路径：`/Users/newuser/Project/ILRuntime/Debugging/VSCode/VSCodeExtension`
5. 按 `F5` 启动开发模式

### 2. 验证热更新功能
在新打开的VSCode窗口中：

#### 2.1 检查状态栏
- 查看右下角状态栏是否显示热更新状态
- 应该显示 "热更新: 监控中" 或类似信息

#### 2.2 测试命令
按 `Cmd+Shift+P` 打开命令面板，测试以下命令：

1. **Show Hot Reload Status**
   - 输入：`ILRuntime Debug: Show Hot Reload Status`
   - 应该显示热更新状态和配置信息

2. **Manual Hot Reload**
   - 输入：`ILRuntime Debug: Manual Hot Reload`
   - 应该触发手动热更新并显示通知

3. **Sync Breakpoints**
   - 输入：`ILRuntime Debug: Sync Breakpoints`
   - 应该同步断点并显示通知

4. **Export Breakpoints**
   - 输入：`ILRuntime Debug: Export Breakpoints`
   - 应该打开保存对话框，允许导出断点配置

5. **Import Breakpoints**
   - 输入：`ILRuntime Debug: Import Breakpoints`
   - 应该打开文件选择对话框，允许导入断点配置

6. **Backup Breakpoints**
   - 输入：`ILRuntime Debug: Backup Breakpoints`
   - 应该自动备份断点配置并显示备份路径

7. **Show Breakpoint Info**
   - 输入：`ILRuntime Debug: Show Breakpoint Info`
   - 应该显示断点配置文件的详细信息

8. **Show ILRuntime Status**
   - 输入：`ILRuntime Debug: Show ILRuntime Status`
   - 应该显示ILRuntime和补丁工具的状态信息

9. **Show Patch History**
   - 输入：`ILRuntime Debug: Show Patch History`
   - 应该显示补丁历史记录

10. **Cleanup Patch Files**
    - 输入：`ILRuntime Debug: Cleanup Patch Files`
    - 应该清理7天前的补丁文件

#### 2.3 测试文件监控
1. 在扩展目录中创建一个测试C#文件
2. 修改文件内容
3. 观察是否触发热更新事件
4. 查看控制台输出和通知

### 3. 测试断点功能

#### 3.1 设置断点
1. 打开一个C#文件
2. 在代码行上点击设置断点
3. 观察断点是否正常显示

#### 3.2 测试断点重定位
1. 修改包含断点的代码
2. 观察断点是否自动重定位
3. 检查断点状态是否正确

## 预期行为

### 正常情况
- 状态栏显示 "热更新: 监控中"
- 文件变更时自动触发热更新
- 断点自动重定位到正确位置
- 显示相应的通知消息

### 错误情况
- 状态栏显示 "热更新: 错误"
- 显示错误通知
- 控制台输出错误信息

## 故障排除

### 问题1：热更新功能未启动
- 检查VSCode控制台是否有错误信息
- 确认扩展是否正确加载
- 检查文件权限

### 问题2：断点重定位失败
- 检查文件路径是否正确
- 确认文件编码格式
- 查看控制台错误信息

### 问题3：状态栏不显示
- 检查VSCode版本兼容性
- 确认扩展激活事件
- 重启VSCode

## 下一步开发

### 待实现功能
1. **ILRuntime集成**
   - 调用HybridPatch系统
   - 实现真实的补丁生成和应用
   - 集成AssemblyPatch

2. **高级断点重定位**
   - 基于方法签名的重定位
   - 支持复杂代码变更
   - 智能位置匹配

3. **配置管理**
   - 热更新配置界面
   - 断点配置持久化
   - 用户偏好设置

4. **性能优化**
   - 增量更新检测
   - 批量处理优化
   - 内存使用优化

## 开发日志

### 2024-08-20
- ✅ 创建断点映射系统
- ✅ 实现热更新管理器
- ✅ 集成VSCode扩展
- ✅ 添加用户界面元素
- ✅ 完成基础功能测试

### 2024-08-20 (阶段二)
- ✅ 实现调试协议扩展
- ✅ 添加自定义调试命令支持
- ✅ 实现断点持久化管理
- ✅ 添加断点配置导入导出功能
- ✅ 实现自动备份和恢复机制
- ✅ 完成调试协议扩展测试

### 2024-08-20 (阶段三)
- ✅ 实现ILRuntime集成管理器
- ✅ 添加补丁文件生成和应用功能
- ✅ 实现程序集分析和类型提取
- ✅ 添加补丁历史管理功能
- ✅ 实现补丁文件清理机制
- ✅ 完成ILRuntime集成测试
