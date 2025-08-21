using UnityEngine;

/// <summary>
/// 测试热更新功能的示例类
/// 用于验证ILRuntime集成功能
/// </summary>
public class TestHotfix : MonoBehaviour
{
    [Header("测试参数")]
    public int testValue = 42;
    public string testMessage = "Hello ILRuntime!";
    
    void Start()
    {
        Debug.Log("TestHotfix Start");
        TestMethod();
        TestMethodWithParams(testValue, testMessage);
    }
    
    void Update()
    {
        // 按空格键触发测试
        if (Input.GetKeyDown(KeyCode.Space))
        {
            TestMethod();
        }
    }
    
    /// <summary>
    /// 基础测试方法
    /// </summary>
    void TestMethod()
    {
        Debug.Log("TestMethod called");
        // 在这里设置断点进行测试
        int value = 42;
        Debug.Log($"Value: {value}");
        
        // 模拟一些计算
        for (int i = 0; i < 5; i++)
        {
            Debug.Log($"Iteration {i}: {value + i}");
        }
    }
    
    /// <summary>
    /// 带参数的测试方法
    /// </summary>
    void TestMethodWithParams(int value, string message)
    {
        Debug.Log($"TestMethodWithParams: {message}, Value: {value}");
        
        // 测试条件断点
        if (value > 50)
        {
            Debug.Log("Value is greater than 50");
        }
        else
        {
            Debug.Log("Value is less than or equal to 50");
        }
    }
    
    /// <summary>
    /// 测试异常处理
    /// </summary>
    public void TestException()
    {
        try
        {
            Debug.Log("Testing exception handling");
            throw new System.Exception("Test exception");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Caught exception: {e.Message}");
        }
    }
    
    /// <summary>
    /// 测试异步方法
    /// </summary>
    public async System.Threading.Tasks.Task TestAsyncMethod()
    {
        Debug.Log("Async method started");
        await System.Threading.Tasks.Task.Delay(1000);
        Debug.Log("Async method completed");
    }
}
