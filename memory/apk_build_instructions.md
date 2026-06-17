# 本地构建 Release APK (内联构建) ✅

## ✅ 最新成功构建记录
**日期**: 2026-06-03  
**耗时**: 9 分 48 秒  
**状态**: BUILD SUCCESSFUL  
**APK**: `android/app/build/outputs/apk/release/app-release.apk` (约 67 MB)

---

## 🚀 一键构建命令（推荐）

### 方式 1：完整快速打包（自动升级版本）
```bash
cd C:\jizhang
quick-build.bat
```

### 方式 2：基础打包（不升级版本）
```bash
cd C:\jizhang\android
C:\gradle-9.3.1\bin\gradle.bat assembleRelease --no-daemon
```

---

## 🔧 环境配置检查清单

| 组件 | 版本/路径 | 状态 |
|------|-----------|------|
| **JDK** | Java 17 (`C:\Program Files\Java\jdk-17.0.19`) | ✅ 已配置 |
| **Gradle** | 9.3.1 (`C:\gradle-9.3.1\bin\gradle.bat`) | ✅ 已安装 |
| **Node.js** | v20.18.1 | ⚠️ 有警告但不影响 |
| **Android SDK** | `C:\Users\Administrator\AppData\Local\Android\Sdk` | ✅ 已安装 |
| **NDK** | r27e (27.1.12297006) | ✅ 已安装 |

---

## 📝 必须存在的配置文件

### 1. gradle.properties
```properties
org.gradle.java.home=C:\\Program Files\\Java\\jdk-17.0.19
```

### 2. local.properties
```properties
sdk.dir=C:\\Users\\Administrator\\AppData\\Local\\Android\\Sdk
```

---

## 🔄 完整构建流程（首次或清理后）

```bash
# 步骤 1: 重新生成 native 项目
cd C:\jizhang
npx expo prebuild --platform android --clean

# 步骤 2: 使用 Gradle 构建 Release APK
cd android
C:\gradle-9.3.1\bin\gradle.bat assembleRelease --no-daemon
```

---

## 📦 构建产物位置

| 类型 | 路径 |
|------|------|
| **APK** | `android/app/build/outputs/apk/release/app-release.apk` |
| **Bundle** | `android/app/build/generated/assets/react/release/index.android.bundle` |
| **Sourcemap** | `android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.packager.map` |

---

## ⚠️ 常见问题处理

### 问题 1: Native 代码缺失
**现象**: CMake 报错找不到 codegen 目录  
**解决**: 运行 `npx expo prebuild --platform android --clean` 重新生成

### 问题 2: 环境变量错误
**现象**: JDK 路径找不到的错误  
**解决**: 检查 gradle.properties 中 `org.gradle.java.home` 是否正确指向 JDK 17

### 问题 3: Metro bundler 失败
**现象**: Node.js 进程退出码非零  
**解决**: 清理 build 目录并重新运行 prebuild

---

## 💡 提示

1. 修改 package.json 或新增 Expo 模块后需先运行 `prebuild --clean`
2. 增量构建速度更快，无需每次清理
3. 首次构建约 10 分钟，后续构建约 3-5 分钟
4. 使用 `version.bat` 管理版本号，自动化程度更高
