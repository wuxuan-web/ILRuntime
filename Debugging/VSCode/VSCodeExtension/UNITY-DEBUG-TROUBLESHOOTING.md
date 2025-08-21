# Unity ILRuntime调试服务故障排除

## 问题确认
- ✅ VSCode扩展UDP监听正常
- ❌ 未收到Unity调试服务广播
- 🔍 问题定位：Unity端调试服务配置

## 排查步骤

### 1. 检查Unity控制台输出

在Unity中运行项目，查看控制台是否有以下信息：
```
ILRuntime调试服务已启动，端口: 56000
DebugService Started
ILRuntime Debug Service Started
```

**如果没有看到这些信息，说明调试服务未启动**

### 2. 检查ILRuntime版本

确认ILRuntime版本是否支持调试功能：
- 需要ILRuntime 1.6.0或更高版本
- 确保包含调试模块的DLL

### 3. 检查调试服务启动代码

在Unity项目中查找是否有以下代码：
```csharp
// 方式1：直接启动
DebugService.StartDebugService(56000);

// 方式2：通过ILRuntime管理器
ILRuntimeManager.Instance.StartDebugService();

// 方式3：通过配置启动
if (enableDebug) {
    StartDebugService();
}
```

### 4. 检查端口配置

确认Unity端和VSCode端使用相同的端口：
- Unity端：56000
- VSCode端：56000

### 5. 检查网络配置

#### 5.1 检查防火墙
```bash
# 检查端口是否被占用
netstat -an | grep 56000

# 检查防火墙规则
sudo pfctl -s rules | grep 56000
```

#### 5.2 检查网络接口
Unity可能绑定到了错误的网络接口，尝试：
```csharp
// 绑定到所有接口
DebugService.StartDebugService(56000, "0.0.0.0");

// 或绑定到本地回环
DebugService.StartDebugService(56000, "127.0.0.1");
```

### 6. 手动测试调试服务

#### 6.1 创建测试脚本
在Unity中创建测试脚本：
```csharp
using UnityEngine;
using ILRuntime.Runtime.Debugger;

public class DebugServiceTest : MonoBehaviour
{
    void Start()
    {
        TestDebugService();
    }
    
    void TestDebugService()
    {
        try
        {
            DebugService.StartDebugService(56000);
            Debug.Log("✅ 调试服务启动成功");
            
            // 发送测试广播
            SendTestBroadcast();
        }
        catch (System.Exception e)
        {
            Debug.LogError($"❌ 调试服务启动失败: {e.Message}");
        }
    }
    
    void SendTestBroadcast()
    {
        // 发送测试UDP广播
        var socket = new System.Net.Sockets.UdpClient();
        var data = System.Text.Encoding.UTF8.GetBytes("ILRuntime Debug Test");
        socket.Send(data, data.Length, "255.255.255.255", 56000);
        Debug.Log("📡 测试广播已发送");
    }
}
```

#### 6.2 运行测试
1. 将测试脚本添加到场景中的GameObject
2. 运行Unity项目
3. 观察控制台输出
4. 检查网络诊断脚本是否收到消息

### 7. 常见解决方案

#### 方案1：手动启动调试服务
如果Unity项目没有自动启动调试服务，手动添加：
```csharp
void Start()
{
    // 现有的初始化代码...
    
    // 手动启动调试服务
    if (Application.isEditor || Debug.isDebugBuild)
    {
        StartDebugService();
    }
}

void StartDebugService()
{
    try
    {
        DebugService.StartDebugService(56000);
        Debug.Log("ILRuntime调试服务已启动，端口: 56000");
    }
    catch (System.Exception e)
    {
        Debug.LogError($"启动调试服务失败: {e.Message}");
    }
}
```

#### 方案2：检查ILRuntime集成
确保ILRuntime正确集成到Unity项目中：
1. 检查ILRuntime DLL是否正确导入
2. 确认调试模块是否包含
3. 验证版本兼容性

#### 方案3：使用不同的端口
如果56000端口有问题，尝试其他端口：
```csharp
// Unity端
DebugService.StartDebugService(56001);

// VSCode端配置
"broadcastPort": 56001
```

## 下一步行动

1. **检查Unity控制台输出**
2. **确认调试服务启动代码**
3. **测试网络连接**
4. **手动启动调试服务**
5. **验证UDP广播**
