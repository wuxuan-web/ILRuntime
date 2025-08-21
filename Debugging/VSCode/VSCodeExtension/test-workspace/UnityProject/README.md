# Unity ILRuntime热更新测试项目

## 项目结构
```
UnityProject/
├── Assets/
│   ├── Scripts/
│   │   ├── Hotfix/           # 热更新脚本（会编译成DLL）
│   │   │   ├── TestHotfix.cs
│   │   │   └── HotfixManager.cs
│   │   └── Framework/        # 框架脚本（不会热更新）
│   │       └── ILRuntimeManager.cs
│   ├── StreamingAssets/      # 热更新DLL存放位置
│   │   └── Hotfix.dll
│   └── Scenes/
│       └── TestScene.unity
├── HotfixAOT/               # 热更新项目（独立编译）
│   ├── TestHotfix.cs
│   └── HotfixAOT.csproj
└── Patches/                 # 补丁文件目录
    └── *.patch
```

## 编译流程
1. 编译HotfixAOT项目生成DLL
2. 将DLL复制到Unity的StreamingAssets目录
3. Unity运行时加载DLL
4. 使用VSCode扩展进行热更新调试
