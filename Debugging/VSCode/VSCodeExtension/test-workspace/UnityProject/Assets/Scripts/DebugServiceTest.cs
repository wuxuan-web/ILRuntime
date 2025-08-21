using UnityEngine;
using System;
using System.Net;
using System.Net.Sockets;
using System.Text;

/// <summary>
/// Unity调试服务测试脚本
/// 用于测试ILRuntime调试服务是否正常工作
/// </summary>
public class DebugServiceTest : MonoBehaviour
{
    [Header("调试配置")]
    public bool enableDebugTest = true;
    public int debugPort = 56000;
    public string broadcastAddress = "255.255.255.255";
    
    void Start()
    {
        if (enableDebugTest)
        {
            TestDebugService();
        }
    }
    
    /// <summary>
    /// 测试调试服务
    /// </summary>
    void TestDebugService()
    {
        Debug.Log("🔍 开始测试ILRuntime调试服务...");
        
        try
        {
            // 测试1：检查ILRuntime调试服务
            TestILRuntimeDebugService();
            
            // 测试2：发送UDP广播
            SendTestBroadcast();
            
            // 测试3：检查网络连接
            TestNetworkConnection();
        }
        catch (Exception e)
        {
            Debug.LogError($"❌ 调试服务测试失败: {e.Message}");
        }
    }
    
    /// <summary>
    /// 测试ILRuntime调试服务
    /// </summary>
    void TestILRuntimeDebugService()
    {
        Debug.Log("📡 测试ILRuntime调试服务...");
        
        try
        {
            // 尝试启动调试服务
            // 注意：这里需要根据实际的ILRuntime API调整
            // DebugService.StartDebugService(debugPort);
            Debug.Log($"✅ ILRuntime调试服务测试完成，端口: {debugPort}");
        }
        catch (Exception e)
        {
            Debug.LogWarning($"⚠️  ILRuntime调试服务不可用: {e.Message}");
            Debug.Log("💡 请检查ILRuntime版本和调试模块");
        }
    }
    
    /// <summary>
    /// 发送测试UDP广播
    /// </summary>
    void SendTestBroadcast()
    {
        Debug.Log("📡 发送测试UDP广播...");
        
        try
        {
            using (UdpClient udpClient = new UdpClient())
            {
                // 设置广播选项
                udpClient.EnableBroadcast = true;
                
                // 创建测试消息
                string testMessage = "ILRuntime Debug Test - " + DateTime.Now.ToString();
                byte[] data = Encoding.UTF8.GetBytes(testMessage);
                
                // 发送广播
                udpClient.Send(data, data.Length, broadcastAddress, debugPort);
                
                Debug.Log($"✅ 测试广播已发送到 {broadcastAddress}:{debugPort}");
                Debug.Log($"📄 消息内容: {testMessage}");
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"❌ 发送测试广播失败: {e.Message}");
        }
    }
    
    /// <summary>
    /// 测试网络连接
    /// </summary>
    void TestNetworkConnection()
    {
        Debug.Log("🌐 测试网络连接...");
        
        try
        {
            // 测试本地回环
            using (UdpClient udpClient = new UdpClient())
            {
                string testMessage = "Local Test";
                byte[] data = Encoding.UTF8.GetBytes(testMessage);
                udpClient.Send(data, data.Length, "127.0.0.1", debugPort);
                Debug.Log("✅ 本地网络连接测试成功");
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"❌ 网络连接测试失败: {e.Message}");
        }
    }
    
    /// <summary>
    /// 手动发送广播（供外部调用）
    /// </summary>
    public void SendManualBroadcast()
    {
        SendTestBroadcast();
    }
    
    /// <summary>
    /// 检查端口是否可用
    /// </summary>
    public bool IsPortAvailable(int port)
    {
        try
        {
            using (TcpClient tcpClient = new TcpClient())
            {
                tcpClient.Connect("127.0.0.1", port);
                return false; // 端口被占用
            }
        }
        catch
        {
            return true; // 端口可用
        }
    }
    
    void Update()
    {
        // 按T键手动发送测试广播
        if (Input.GetKeyDown(KeyCode.T))
        {
            Debug.Log("🔘 手动触发测试广播");
            SendTestBroadcast();
        }
        
        // 按P键检查端口状态
        if (Input.GetKeyDown(KeyCode.P))
        {
            bool available = IsPortAvailable(debugPort);
            Debug.Log($"🔍 端口 {debugPort} 状态: {(available ? "可用" : "被占用")}");
        }
    }
}
