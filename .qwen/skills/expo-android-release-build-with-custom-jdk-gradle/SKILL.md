---
name: expo-android-release-build-with-custom-jdk-gradle
description: Build Expo Android Release APK with custom Java 17 and Gradle 8.14.3
source: auto-skill
extracted_at: '2026-06-02T15:58:58.453Z'
---

# Building Expo Android Release APK with Custom JDK and Gradle Versions

This procedure outlines the steps to build a React Native/Expo Android Release APK using specific versions of Java (JDK 17) and Gradle (8.14.3), especially when these differ from the system defaults or when Expo CLI encounters compatibility issues.

## Problem Solved

When building Release APKs for Expo projects:
- The `npx expo run:android` command tries to launch an emulator/device, which may not be available
- System JDK/Gradle versions may not match project requirements
- Node.js version warnings can interfere with Metro bundling

## Solution Procedure

### 1. Prebuild the Native Project

```bash
cd <project-root>
npx expo prebuild --clean -p android
```

This generates the native Android project structure if it doesn't exist.

### 2. Configure Gradle Wrapper for Custom Gradle Version

Edit `android/gradle/wrapper/gradle-wrapper.properties`:

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=C\:/gradle-8.14.3-bin.zip  # Use local path instead of remote URL
networkTimeout=10000
validateDistributionUrl=false  # Allow local paths
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

Replace `C\:/gradle-8.14.3-bin.zip` with your actual local Gradle zip path.

### 3. Configure Java Home in gradle.properties

Edit `android/gradle.properties` and add:

```properties
# Use specific Java 17
org.gradle.java.home=C:\\Program Files\\Java\\jdk-17.0.19
```

Ensure the path matches your JDK installation and use double backslashes in `.properties` files.

### 4. Fix JS Import Issues (if encountered)

If you encounter "ES2015 named imports do not destructure" errors during bundling:

**Before:**
```typescript
import { loadExpenses, saveExpenses, addExpense as addExpenseRaw } from './storage';
```

**After:**
```typescript
import * as storage from './storage';
const { loadExpenses, saveExpenses, addExpense: addExpenseRaw } = storage;
```

### 5. Run Gradle Directly Instead of Expo CLI

Stop any running Gradle daemons:

```bash
cd android
taskkill /F /IM gradle.exe 2>nul
```

Build the Release APK using local Gradle:

```bash
# For bundle (APK + XAPK for Play Store)
C:\gradle-8.14.3\bin\gradle.bat bundleRelease --no-daemon

# For APK only
C:\gradle-8.14.3\bin\gradle.bat assembleRelease --no-daemon
```

The `--no-daemon` flag ensures a clean build each time.

### 6. Locate the Output APK

After successful build, the APK will be at:

```
android/app/build/outputs/apk/release/app-release.apk
```

For a production-ready APK:
- Generate a signed keystore following [React Native docs](https://reactnative.dev/docs/signed-apk-android)
- Update `android/app/build.gradle` signingConfigs with production credentials

## Common Pitfalls

### 1. Node.js version mismatch
Expo/RN may warn about unsupported Node versions (e.g., v20.18.1). This is often cosmetic but can affect Metro bundling reliability.

### 2. Kotlin daemon crashes
If you see `DaemonCrashedException`, try adding JVM args:
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError
```

### 3. Hard link failures on Windows
CMake may copy files instead of hard-linking. This is normal on network drives or certain file systems and just slows down builds slightly.

### 4. Signing configuration
Debug builds use a debug keystore by default. Always sign release builds with a production keystore before publishing.

### 5. local.properties path encoding issue ⚠️ (CRITICAL)

**Problem:** Using backslashes in `sdk.dir` causes Gradle parsing errors:
```
Trailing char < > at index 48: C:\Users\Administrator\AppData\Local\Android\Sdk
```

**Solution:** Use forward slashes ONLY in `.properties` files:
```properties
sdk.dir=C:/Users/Administrator/AppData/Local/Android/Sdk
```

**Why it fails:** Windows batch/cmd interprets `\` as escape character, causing Gradle to misparse the path.

**How to write safely:**
- Use PowerShell: `Set-Content -Path "file" -Value "key=value"`
- Or use plain text editor without special escapes
- Never use `echo` with backslash paths in command line

### 6. Path encoding corruption in error messages
If you see garbled text like `锟斤拷锟斤拷` in build logs, this indicates UTF-8 encoding issues in Chinese characters. The build usually still succeeds if you see `BUILD SUCCESSFUL` at the end.

## Verification

Check build success:
- Look for `BUILD SUCCESSFUL in Xs` in Gradle output
- Verify `app-release.apk` exists at the expected location
- Test install on device: `adb install app-release.apk`

## Future Reference

Keep this configuration documented in your project's AGENTS.md or similar guide for team members who need to replicate the build process.