---
name: expo-android-local-release-build-skaffold
description: Expo React Native Android Release APK build with NDK workarounds
source: auto-skill
extracted_at: '2026-06-03T14:30:00.000Z'
---

# 本地构建 Expo React Native Android Release APK (NDK 问题处理)

## 问题背景
Expo React Native 项目在本地构建 Release APK 时，使用 NDK 27.1+ 会导致 Clang++ 编译器崩溃（Exception Code: 0xC0000005）。

**错误特征：**
```
clang++: error: clang frontend command failed due to signal (use -v to see invocation)
Exception Code: 0xC0000005
PLEASE submit a bug report to https://github.com/android-ndk/ndk/issues
```

## 解决方案

### 方案 A: EAS Build (推荐) ✅
使用 Expo 云端构建服务，避免本地 NDK 问题：

```bash
cd D:\Desktop\jizhang
eas build -p android --profile production --non-interactive
```

等待构建完成后，从链接下载 APK：
```
https://expo.dev/accounts/{account}/projects/{project}/builds/{build-id}
```

### 方案 B: 本地构建 + NDK r26c

#### 1. 环境要求
- **JDK:** Java 17 (`C:\Program Files\Java\jdk-17.0.19`)
- **Gradle:** 8.14.3
- **NDK:** r26c (稳定版本，不要用 r27.1+)
- **Android SDK:** API 34+, build-tools 34.0.0+

#### 2. 下载并安装 NDK r26c
```powershell
# 下载
curl -L https://dl.google.com/android/repository/android-ndk-r26c-windows.zip -o C:\android-ndk-r26c-windows.zip

# 解压
Expand-Archive -Path C:\android-ndk-r26c-windows.zip -DestinationPath C:\Android\ -Force

# 重命名目录到标准格式
Move-Item "C:\Android\android-ndk-r26c" "C:\Android\android-ndk-r26.0.10775183"
```

#### 3. 配置项目文件

**gradle-wrapper.properties** (`android/gradle/wrapper/gradle-wrapper.properties`):
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.14.3-bin.zip
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

**gradle.properties** (`android/gradle.properties`):
```properties
org.gradle.java.home=C:/Program Files/Java/jdk-17.0.19
newArchEnabled=false
hermesEnabled=true
reactNativeArchitectures=x86_64,armeabi-v7a,arm64-v8a
```

**local.properties** (`android/local.properties`):
```properties
sdk.dir=C:\\Users\\Administrator\\AppData\\Local\\Android\\Sdk
ndk.dir=C:\\Android\\android-ndk-r26.0.10775183
```

#### 4. 清理并重新生成原生代码
```bash
cd D:\Desktop\jizhang
npx expo prebuild --clean -p android
```

#### 5. 执行 Release 构建
```bash
cd D:\Desktop\jizhang\android
.\gradlew.bat assembleRelease --no-daemon
```

APK 输出位置：
```
D:\Desktop\jizhang\android\app\build\outputs\release\app-release.apk
```

## 关键注意事项

### ⚠️ 不要使用新架构
```properties
# ❌ 禁用新架构可避免 NDK 编译问题
newArchEnabled=false
```

### ⚠️ NDK 版本选择
| NDK 版本 | 状态 | 建议 |
|---------|------|------|
| r25d/r26c | 稳定 | ✅ 推荐使用 |
| r27.x | 已知 bug | ❌ 避免使用 |
| r28+ | 未验证 | ❓ 待测试 |

### ⚠️ JavaScript 层兼容性检查
修复以下导入路径以兼容 expo-file-system v56:
```typescript
// ❌ 错误
import * as FileSystem from 'expo-file-system';

// ✅ 正确 - 使用 legacy 模块
import * as FileSystem from 'expo-file-system/legacy';
```

## Troubleshooting

### Clang++ 崩溃
- 降级到 NDK r26c
- 确保 `newArchEnabled=false`
- 尝试只构建 x86_64 架构减少编译压力

### Gradle 缓存问题
```bash
cd D:\Desktop\jizhang\android
.\gradlew.bat clean
rm -rf ./.cxx  # 删除 CMake 缓存
```

### Java 路径问题
在 `gradle.properties` 中使用相对路径或绝对路径:
```properties
org.gradle.java.home=C:/Program Files/Java/jdk-17.0.19
```
