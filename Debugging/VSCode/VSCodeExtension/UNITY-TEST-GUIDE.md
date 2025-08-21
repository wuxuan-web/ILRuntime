# Unity项目ILRuntime集成功能测试指南

## 测试步骤

### 1. 准备Unity项目
- 确保Unity项目已集成ILRuntime
- 生成Hotfix.dll文件
- 在VSCode中打开项目

### 2. 测试基础功能

#### 2.1 检查ILRuntime状态
- 命令: `ILRuntime Debug: Show ILRuntime Status`
- 预期: 显示ILRuntime和补丁工具状态

#### 2.2 测试断点管理
- 创建测试C#文件并设置断点
- 导出/导入断点配置
- 验证断点持久化功能

### 3. 测试热更新功能

#### 3.1 文件监控测试
- 修改C#文件
- 观察状态栏变化
- 检查通知消息

#### 3.2 手动热更新测试
- 命令: `ILRuntime Debug: Manual Hot Reload`
- 检查补丁文件生成
- 验证补丁历史记录

### 4. 预期结果
- ILRuntime状态显示"可用"
- 断点功能正常工作
- 热更新流程正常执行
- 补丁管理功能正常
