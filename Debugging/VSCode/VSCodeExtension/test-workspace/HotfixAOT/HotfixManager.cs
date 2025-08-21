using UnityEngine;
using System;
using System.IO;
using System.Reflection;

namespace HotfixAOT
{
    /// <summary>
    /// 热更新管理器
    /// 负责加载和管理热更新DLL
    /// </summary>
    public class HotfixManager : MonoBehaviour
    {
        [Header("热更新配置")]
        public string hotfixDllPath = "HotfixAOT.dll";
        public bool autoReload = true;
        
        private AppDomain appDomain;
        private object hotfixInstance;
        
        void Start()
        {
            LoadHotfixDll();
        }
        
        /// <summary>
        /// 加载热更新DLL
        /// </summary>
        public void LoadHotfixDll()
        {
            try
            {
                string dllPath = Path.Combine(Application.streamingAssetsPath, hotfixDllPath);
                
                if (!File.Exists(dllPath))
                {
                    Debug.LogError($"热更新DLL不存在: {dllPath}");
                    return;
                }
                
                Debug.Log($"加载热更新DLL: {dllPath}");
                
                // 加载DLL
                byte[] dllBytes = File.ReadAllBytes(dllPath);
                Assembly assembly = Assembly.Load(dllBytes);
                
                // 创建热更新实例
                Type testHotfixType = assembly.GetType("HotfixAOT.TestHotfix");
                if (testHotfixType != null)
                {
                    hotfixInstance = Activator.CreateInstance(testHotfixType);
                    Debug.Log("热更新DLL加载成功");
                }
                else
                {
                    Debug.LogError("未找到TestHotfix类型");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"加载热更新DLL失败: {e.Message}");
            }
        }
        
        /// <summary>
        /// 重新加载热更新DLL
        /// </summary>
        public void ReloadHotfixDll()
        {
            Debug.Log("重新加载热更新DLL");
            LoadHotfixDll();
        }
        
        /// <summary>
        /// 调用热更新方法
        /// </summary>
        public void CallHotfixMethod(string methodName)
        {
            if (hotfixInstance == null)
            {
                Debug.LogWarning("热更新实例未加载");
                return;
            }
            
            try
            {
                Type type = hotfixInstance.GetType();
                MethodInfo method = type.GetMethod(methodName);
                
                if (method != null)
                {
                    method.Invoke(hotfixInstance, null);
                }
                else
                {
                    Debug.LogWarning($"未找到方法: {methodName}");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"调用热更新方法失败: {e.Message}");
            }
        }
        
        void Update()
        {
            // 按R键重新加载
            if (Input.GetKeyDown(KeyCode.R))
            {
                ReloadHotfixDll();
            }
            
            // 按T键测试热更新方法
            if (Input.GetKeyDown(KeyCode.T))
            {
                CallHotfixMethod("TestHotReload");
            }
        }
    }
}
