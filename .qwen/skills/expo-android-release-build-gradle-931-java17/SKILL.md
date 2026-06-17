---
name: expo-android-release-build-gradle-931-java17
description: Build Expo Android Release APK using Gradle 9.3.1 and Java 17 directly
source: auto-skill
extracted_at: '2026-06-03T09:42:28.071Z'
---

# Building Expo Android Release APK with Gradle 9.3.1 and Java 17 (Direct Gradle)

This procedure outlines the steps to build a React Native/Expo Android Release APK using specific versions of Java 17 and Gradle 9.3.1 installed locally, bypassing the Expo CLI emulator requirement.

## Problem Solved

When building Release APKs for Expo projects:
- The `npx expo run:android` command tries to launch an emulator/device, which may not be available
- The Gradle wrapper downloads Gradle every time instead of using local installation
- System JDK/Gradle versions may not match project requirements
- Node.js version warnings can interfere with Metro bundling

## Solution Procedure

### 1. Prebuild the Native Project

Generate the native Android project structure if it doesn't exist:

```bash
cd <project-root>
set NODE_OPTIONS="--max-old-space-size=4096"
npx expo prebuild --platform android --clean
```

### 2. Configure Java Home in gradle.properties

Edit `android/gradle.properties` and add:

```properties
# Java path configuration for local build
org.gradle.java.home=C:\\Program Files\\Java\\jdk-17.0.19
```

**Important**: Use double backslashes (`\\`) in `.properties` files.

### 3. Create local.properties for Android SDK Path

Create `android/local.properties` with forward slashes (NOT backslashes):

```properties
sdk.dir=C:/Users/Administrator/AppData/Local/Android/Sdk
```

⚠️ **Critical**: Windows batch/cmd interprets `\` as escape character, causing Gradle parsing errors like:
```
Trailing char < > at index 48: C:\Users\Administrator\AppData\Local\Android\Sdk
```

Always use forward slashes (`/`) in `.properties` files.

### 4. Run Gradle Directly Instead of Expo CLI

Navigate to the Android directory and build directly with local Gradle:

```bash
cd android
C:\gradle-9.3.1\bin\gradle.bat assembleRelease --no-daemon
```

The `--no-daemon` flag ensures a clean build each time and honors JVM settings properly.

## Expected Output

Build should complete successfully with:
```
BUILD SUCCESSFUL in Xm XXs
XXX actionable tasks: XXX executed, XX up-to-date
```

APK will be located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Environment Requirements

| Component | Version/Path | Status |
|-----------|--------------|--------|
| **JDK** | Java 17 (`C:\Program Files\Java\jdk-17.0.19`) | ✅ Required |
| **Gradle** | 9.3.1 (`C:\gradle-9.3.1`) | ✅ Installed |
| **Node.js** | v20.x (warnings allowed) | ⚠️ Not critical |
| **Android SDK** | `C:/Users/Administrator/AppData/Local/Android/Sdk` | ✅ Required |
| **NDK** | r27e (27.1.12297006) | ✅ Auto-downloaded |

## Common Pitfalls

### 1. gradle-wrapper.properties Configuration

❌ **Don't use custom URLs** - Let the wrapper download Gradle or use the standard distribution URL. The wrapper JAR expects proper Gradle distribution format.

If you want to avoid downloading, ensure `C:\gradle-9.3.1` is already installed (unzipped).

### 2. Local Properties Path Encoding

Using backslashes causes failures:
```properties
# WRONG - Will fail
sdk.dir=C:\Users\Administrator\AppData\Local\Android\Sdk

# CORRECT - Use forward slashes
sdk.dir=C:/Users/Administrator/AppData/Local/Android/Sdk
```

### 3. JAVA_HOME Environment Variable

Don't rely on `JAVA_HOME` environment variable when calling `gradle.bat`. Instead:
- Set `org.gradle.java.home` in `gradle.properties`
- OR call Gradle from PowerShell with explicit env:
```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-17.0.19'; & 'C:\gradle-9.3.1\bin\gradle.bat' ...
```

### 4. Node.js Version Warning

Warning like `Node.js (v20.18.1) is outdated and unsupported` is cosmetic and doesn't affect build success. Metro bundler still works.

### 5. Kotlin/Warn Messages

Deprecation warnings in Kotlin code (e.g., `UIManagerModule`, `getEventDispatcherForReactTag`) are expected with newer React Native versions and don't prevent successful builds.

## Quick Reference Commands

```bash
# Clean and build release APK
cd android
C:\gradle-9.3.1\bin\gradle.bat clean assembleRelease --no-daemon

# Or incremental build (faster)
cd android
C:\gradle-9.3.1\bin\gradle.bat assembleRelease --no-daemon
```

## Installation Verification

Test the APK on a device:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

Or check the file size (typical size ~67MB for production-ready build).

## Production Signing

For Play Store release:
1. Generate keystore following [React Native docs](https://reactnative.dev/docs/signed-apk-android)
2. Update `android/app/build.gradle` signingConfigs
3. Build with `assembleRelease` again
4. Align APK before upload: `jarsigner` or `zipalign`
