# Unity ILRuntime Demo 测试指南

## 使用现有ILRuntime Demo的优势

1. **完整的ILRuntime集成** - Demo已经包含了完整的ILRuntime集成
2. **现成的热更新系统** - 无需自己搭建热更新框架
3. **测试场景完整** - 包含了各种测试用例
4. **稳定可靠** - 经过验证的代码

## 测试步骤

### 步骤1：打开ILRuntime Demo项目

1. **在Unity中打开ILRuntime Demo项目**
   - 路径通常是：`ILRuntime/Demo/`
   - 或者您已有的ILRuntime demo项目

2. **确认项目结构**
   - 检查是否有Hotfix项目
   - 确认StreamingAssets目录存在
   - 验证ILRuntime插件已正确导入

### 步骤2：在VSCode中打开项目

1. **在VSCode中打开ILRuntime Demo项目根目录**
2. **确认扩展已激活**
   - 查看状态栏是否有ILRuntime图标
   - 检查输出面板中的扩展日志

### 步骤3：测试基础功能

#### 3.1 检查ILRuntime状态
- 按 `Cmd+Shift+P` 打开命令面板
- 输入 `ILRuntime Debug: Show ILRuntime Status`
- 应该显示ILRuntime和补丁工具状态

#### 3.2 测试断点功能
- 打开Hotfix项目中的C#文件
- 在关键方法中设置断点
- 测试断点导出/导入功能

#### 3.3 测试热更新功能
- 修改Hotfix项目中的代码
- 重新编译Hotfix项目
- 在Unity中测试热更新效果

### 步骤4：集成VSCode扩展

#### 4.1 配置扩展路径
在VSCode中，扩展会自动检测以下路径：
- `HotfixAOT/` - 热更新项目目录
- `StreamingAssets/` - DLL存放目录
- `Patches/` - 补丁文件目录

#### 4.2 测试命令功能
- `ILRuntime Debug: Show Hot Reload Status` - 显示热更新状态
- `ILRuntime Debug: Manual Hot Reload` - 手动热更新
- `ILRuntime Debug: Sync Breakpoints` - 同步断点
- `ILRuntime Debug: Show Patch History` - 显示补丁历史

### 步骤5：实际测试流程

1. **启动Unity项目**
   - 运行ILRuntime Demo场景
   - 观察控制台输出

2. **在VSCode中修改代码**
   - 修改Hotfix项目中的测试类
   - 重新编译生成新的DLL

3. **测试热更新**
   - 在Unity中触发热更新
   - 验证代码修改是否生效

4. **测试断点调试**
   - 在VSCode中设置断点
   - 在Unity中触发断点
   - 验证调试功能

## 常见问题解决

### 问题1：扩展命令不可用
- 确保在VSCode中打开了ILRuntime Demo项目根目录
- 检查扩展是否已激活
- 尝试重新加载VSCode窗口

### 问题2：断点不工作
- 确认调试会话已启动
- 检查断点设置的文件路径是否正确
- 验证Unity项目是否正在运行

### 问题3：热更新不生效
- 确认Hotfix项目已重新编译
- 检查DLL是否正确复制到StreamingAssets
- 验证Unity中的热更新触发机制

## 测试检查清单

- [ ] ILRuntime Demo项目正常打开
- [ ] VSCode扩展已激活
- [ ] 基础命令可用（Show Status等）
- [ ] 断点功能正常
- [ ] 热更新功能正常
- [ ] 补丁管理功能正常

## 下一步

完成基础测试后，可以：
1. 测试更复杂的热更新场景
2. 验证断点在热更新后的重定位
3. 测试批量文件修改的处理
4. 性能测试和优化
