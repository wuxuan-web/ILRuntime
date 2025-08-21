# Unity ILRuntime插件修改指南

## 需要修改的原因

默认的ILRuntime插件可能没有启用调试功能，需要手动配置才能支持VSCode调试。

## 修改步骤

### 1. 检查ILRuntime调试服务

#### 1.1 查找调试服务脚本
在Unity项目中查找以下文件：
- `ILRuntime/Runtime/Debugger/DebugService.cs`
- `ILRuntime/Runtime/Debugger/ILRuntimeDebugger.cs`
- 或其他包含调试功能的脚本

#### 1.2 确认调试服务是否启用
检查是否有类似代码：
```csharp
// 调试服务启动代码
DebugService.StartDebugService(port);
```

### 2. 修改ILRuntime管理器

#### 2.1 找到ILRuntime管理器
通常位于：
- `Assets/Scripts/ILRuntimeManager.cs`
- `Assets/Scripts/ILRuntime/ILRuntimeManager.cs`
- 或其他管理ILRuntime的脚本

#### 2.2 添加调试服务启动代码
在ILRuntime初始化时添加：

```csharp
using ILRuntime.Runtime.Debugger;

public class ILRuntimeManager : MonoBehaviour
{
    [Header("调试配置")]
    public bool enableDebug = true;
    public int debugPort = 56000;
    
    void Start()
    {
        InitializeILRuntime();
    }
    
    void InitializeILRuntime()
    {
        // 现有的ILRuntime初始化代码...
        
        // 添加调试服务启动
        if (enableDebug)
        {
            StartDebugService();
        }
    }
    
    void StartDebugService()
    {
        try
        {
            DebugService.StartDebugService(debugPort);
            Debug.Log($"ILRuntime调试服务已启动，端口: {debugPort}");
        }
        catch (Exception e)
        {
            Debug.LogError($"启动调试服务失败: {e.Message}");
        }
    }
    
    void OnDestroy()
    {
        // 停止调试服务
        if (enableDebug)
        {
            DebugService.StopDebugService();
        }
    }
}
```

### 3. 检查ILRuntime版本

#### 3.1 确认ILRuntime版本
确保使用的是支持调试的ILRuntime版本（通常1.6.0以上）

#### 3.2 更新ILRuntime（如果需要）
如果版本过旧，需要更新到最新版本

### 4. 配置调试参数

#### 4.1 在Inspector中配置
在Unity编辑器中：
1. 选择包含ILRuntimeManager的GameObject
2. 在Inspector中勾选 "Enable Debug"
3. 设置 "Debug Port" 为 56000

#### 4.2 通过代码配置
```csharp
// 在运行时动态配置
ILRuntimeManager.Instance.enableDebug = true;
ILRuntimeManager.Instance.debugPort = 56000;
```

### 5. 测试调试服务

#### 5.1 启动Unity项目
1. 运行Unity项目
2. 查看控制台输出
3. 应该看到 "ILRuntime调试服务已启动" 信息

#### 5.2 检查网络连接
```bash
# 在终端中检查端口是否开放
netstat -an | grep 56000
```

### 6. 常见问题解决

#### 问题1：找不到DebugService
**原因**：ILRuntime版本不支持调试或缺少调试模块
**解决**：
1. 更新ILRuntime到最新版本
2. 确保包含调试模块的DLL

#### 问题2：端口被占用
**原因**：56000端口已被其他程序使用
**解决**：
1. 更改调试端口
2. 关闭占用端口的程序

#### 问题3：调试服务启动失败
**原因**：权限或网络问题
**解决**：
1. 检查防火墙设置
2. 以管理员权限运行Unity

### 7. 验证修改

#### 7.1 启动测试
1. 运行Unity项目
2. 查看控制台输出
3. 确认调试服务启动成功

#### 7.2 连接测试
1. 启动VSCode扩展
2. 尝试连接到ILRuntime
3. 验证连接是否成功

## 修改检查清单

- [ ] 找到ILRuntime管理器脚本
- [ ] 添加调试服务启动代码
- [ ] 配置调试参数
- [ ] 测试调试服务启动
- [ ] 验证VSCode连接
- [ ] 测试断点功能
