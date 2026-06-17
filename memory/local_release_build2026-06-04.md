# 本地构建 Release APK (内联构建) ✅

## ✅ 最新成功构建记录
**日期**: 2026-06-04 00:29
**版本**: 2.0.0 (versionCode 10)
**耗时**: 5 分 5 秒（全量构建 + prebuild）
**状态**: BUILD SUCCESSFUL
**APK**: `android/app/build/outputs/apk/release/app-release.apk` (~67.3 MB)
**变更**: 账单统计双日历日期范围选择器、记一笔 datetime picker iOS 闪退修复

---

## ⚠️ 重要提示

**Gradle lint bug 规避方案：**
由于 `react-native-community/datetimepicker` 的 lint 检查存在 bug（"Truncated class file"），需要跳过 lint 任务：

```bash
C:\gradle-9.3.1\bin\gradle.bat assembleRelease --no-daemon -x lintVitalAnalyzeRelease -x lintVitalReportRelease -x lintVitalRelease
```

**建议永久配置：** 在 `android/app/build.gradle` 中添加：
```groovy
// 禁用 lint 检查以规避 datetimepicker 的 Gradle lint bug
tasks.matching { it.name.startsWith("lintVital") }.configureEach {
    enabled = false
}
```

---

## 环境要求

| 组件 | 版本/路径 | 状态 |
|------|-----------|------|
| **JDK** | Java 17 (`C:\Program Files\Java\jdk-17.0.19`) | ✅ 已配置 |
| **Gradle** | 9.3.1 (`C:\gradle-9.3.1\bin\gradle.bat`) | ✅ 已安装 |
| **Node.js** | v20.18.1（警告但不影响） | ⚠️ |
| **Android SDK** | `C:\Users\Administrator\AppData\Local\Android\Sdk` | ✅ 已安装 |
| **NDK** | r27e (27.1.12297006) | ✅ 已安装 |

---

## 配置文件

### gradle.properties
```properties
org.gradle.java.home=C:\\Program Files\\Java\\jdk-17.0.19
```

### local.properties（必须创建）
```properties
sdk.dir=C:\\Users\\Administrator\\AppData\\Local\\Android\\Sdk
```

---

## 🚀 一键构建命令

```bash
cd C:\jizhang\android

# 使用 Gradle 9.3.1 构建 Release APK (绕过 lint bug)
C:\gradle-9.3.1\bin\gradle.bat assembleRelease --no-daemon -x lintVitalAnalyzeRelease -x lintVitalReportRelease -x lintVitalRelease
```

---

## 🔄 完整构建流程（首次或清理后）

```bash
# 1. 重新生成原生项目（清理并更新 native 代码）
cd C:\jizhang
npx expo prebuild --platform android --clean

# 2. 使用 Gradle 构建 Release APK
cd android
C:\gradle-9.3.1\bin\gradle.bat assembleRelease --no-daemon -x lintVitalAnalyzeRelease -x lintVitalReportRelease -x lintVitalRelease
```

---

## 构建产物位置

| 类型 | 路径 |
|------|------|
| **APK** | `android/app/build/outputs/apk/release/app-release.apk` |
| **Bundle** | `android/app/build/generated/assets/react/release/index.android.bundle` |
| **Sourcemap** | `android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.packager.map` |

---

## ⚠️ 注意事项

1. **SDK 路径**: `local.properties` 必须存在且包含正确的 sdk.dir
2. **环境变量**: `org.gradle.java.home` 在 gradle.properties 中指向 JDK 17
3. **Node.js 警告**: v20.18.1 有版本警告但不影响构建成功
4. **构建时间**: 首次或清理后约 10 分钟，增量构建 ~50 秒
5. **prebuild 必需**: 修改 package.json 或新增 Expo 模块后需先运行 `npx expo prebuild --platform android --clean`
6. **Lint Bug**: 遇到 `react-native-community/datetimepicker` lint 错误是正常的，已在上文中说明规避方案

---

## 📝 近期变更说明

**2026-06-04 本次更新内容**:
- ✅ 账单统计 - 日期范围选择器改为双日历模式（Android 同屏显示两个 picker，iOS 点击弹出 Modal）
- ✅ 账单统计 - 支出/收入分类独立筛选、删除消费类型（支出/收入）筛选按钮
- ✅ 记一笔/编辑账单 - iOS datetime picker 闪退修复（移除嵌套 Modal，添加确认按钮）
- ✅ 记一笔/编辑账单 - 日期和时间选择器合并为一个 datetime picker（减少操作步骤）
- ✅ 账单统计 - 分类统计区分支出/收入（新增切换按钮）
- ✅ 账单统计 - 付款方式统计区分支出/收入（新增切换按钮）
- ✅ 日期和时间选择器改为滚筒式滚轮 UI（Android 和 iOS 统一显示效果）
- ✅ 首页记录排序优化：按日期时间由近到远显示（最新在最前）
- ✅ 记一笔/编辑账单界面金额输入改为手机原生键盘，取消自定义 Numpad
