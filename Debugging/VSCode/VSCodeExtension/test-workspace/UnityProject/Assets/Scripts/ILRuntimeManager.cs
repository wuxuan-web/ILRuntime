using UnityEngine;
using System;
using System.IO;
using ILRuntime.Runtime.Enviorment;
using ILRuntime.Runtime.Debugger;

public class ILRuntimeManager : MonoBehaviour
{
    [Header("ILRuntime配置")]
    public bool enableDebug = true;
    public int debugPort = 56000;
    public string hotfixDllPath = "HotfixAOT.dll";
    
    private AppDomain appDomain;
    private bool isInitialized = false;
    
    void Start()
    {
        InitializeILRuntime();
    }
    
    void InitializeILRuntime()
    {
        try
        {
            // 创建ILRuntime AppDomain
            appDomain = new AppDomain();
            
            // 加载热更新DLL
            LoadHotfixDll();
            
            // 启动调试服务
            if (enableDebug)
            {
                StartDebugService();
            }
            
            isInitialized = true;
            Debug.Log("ILRuntime初始化成功");
        }
        catch (Exception e)
        {
            Debug.LogError($"ILRuntime初始化失败: {e.Message}");
        }
    }
    
    void LoadHotfixDll()
    {
        string dllPath = Path.Combine(Application.streamingAssetsPath, hotfixDllPath);
        
        if (!File.Exists(dllPath))
        {
            Debug.LogWarning($"热更新DLL不存在: {dllPath}");
            return;
        }
        
        // 加载DLL到ILRuntime
        using (FileStream fs = new FileStream(dllPath, FileMode.Open, FileAccess.Read))
        {
            appDomain.LoadAssembly(fs);
        }
        
        Debug.Log($"热更新DLL加载成功: {dllPath}");
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
        if (enableDebug)
        {
            try
            {
                DebugService.StopDebugService();
                Debug.Log("ILRuntime调试服务已停止");
            }
            catch (Exception e)
            {
                Debug.LogError($"停止调试服务失败: {e.Message}");
            }
        }
    }
    
    // 公共方法供外部调用
    public bool IsInitialized => isInitialized;
    public AppDomain AppDomain => appDomain;
}
