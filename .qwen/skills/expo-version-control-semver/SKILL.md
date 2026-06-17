---
name: expo-version-control-semver
description: Automated version control and release build workflow with SemVer semantics
source: auto-skill
extracted_at: '2026-06-03T14:35:00.000Z'
---

# Expo Android Version Control & Release Build Guide

This guide covers implementing semantic versioning (SemVer) for an Expo React Native accounting app, including automated version updates and release APK builds.

## Overview

Version control is essential for tracking app changes, managing releases, and maintaining a professional development workflow. This system uses Semantic Versioning (SemVer) `X.Y.Z` format with automated batch scripts for Windows.

## Version Number Format

**Semantic Versioning**: `MAJOR.MINOR.PATCH`

| Component | Description | Example Change |
|-----------|-------------|----------------|
| **MAJOR (X)** | Incompatible API changes | 1.0.0 → 2.0.0 |
| **MINOR (Y)** | New features, backward compatible | 1.0.0 → 1.1.0 |
| **PATCH (Z)** | Bug fixes, backward compatible | 1.0.0 → 1.0.1 |

### When to Increment

```
重大改动（破坏性修改） → major    v1.0.0 → v2.0.0
新增功能（向后兼容） → minor    v1.0.0 → v1.1.0  
Bug 修复              → patch    v1.0.0 → v1.0.1
```

## Implementation Files

### 1. version.bat - Version Management Tool

Located at project root: `C:\jizhang\version.bat`

**Commands:**
```bash
# View current version from package.json
version.bat

# Interactive version upgrade
version.bat bump
# Enter: 1=major, 2=minor, 3=patch

# Direct upgrade specific version level
version.bat major   # X.Y.Z → (X+1).0.0
version.bat minor   # X.Y.Z → X.(Y+1).0
version.bat patch   # X.Y.Z → X.Y.(Z+1)

# Build Release APK only
version.bat build
```

**Key Features:**
- Reads/writes version in `package.json`
- PowerShell-based JSON manipulation for accuracy
- Validates input and shows current version before confirming
- Supports incremental building with proper cleanup

### 2. quick-build.bat - One-Click Release Build

Located at project root: `C:\jizhang\quick-build.bat`

**Usage:**
```bash
quick-build.bat
# Prompts:
# - Do you want to upgrade version? (y/n)
# - Upgrade type (major/minor/patch)
# - Rebuild native modules? (y/n)
# Automatically generates jizhang-v[VERSION].apk
```

**Workflow:**
1. Reads current version from `package.json`
2. Asks user if version upgrade needed
3. Updates `package.json` with new version
4. Optionally runs `expo prebuild --platform android --clean`
5. Builds release APK with Gradle
6. Copies APK to root as `jizhang-v[VERSION].apk`

### 3. CHANGELOG.md - Change Log Template

Tracks all significant changes per version:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.0.7] - 2026-06-03

### 🎨 UI 优化
- 付款方式管理简化：新增付款方式时不再强制选择图标
- 日期、时间、分类、付款方式输入框风格统一
- 分类选择器改为上下滚动列表

### 🐛 Bug 修复
- 修复主界面付款方式字段显示乱码
```

### 4. RELEASE.md - Release Notes Template

User-facing release notes:

```markdown
# Release Notes - 记账 APP

## v1.0.7 - 2026-06-03

### ✨ 新功能
- 
### 🔧 优化改进
- 
### 🐛 Bug 修复
- 
```

## Environment Requirements

For local release builds on Windows:

| Component | Version | Path |
|-----------|---------|------|
| JDK | 17 | `C:\Program Files\Java\jdk-17.0.19` |
| Gradle | 9.3.1 | `C:\gradle-9.3.1\bin\gradle.bat` |
| Android SDK | Latest | `C:\Users\Administrator\AppData\Local\Android\Sdk` |
| NDK | r27e | Included with Android Studio |

### Configuration Files

**gradle.properties**
```properties
org.gradle.java.home=C:\\Program Files\\Java\\jdk-17.0.19
```

**local.properties** (create if missing)
```properties
sdk.dir=C:\\Users\\Administrator\\AppData\\Local\\Android\\Sdk
```

## Full Build Workflow

### Initial Setup (First Time Only)

```bash
# 1. Navigate to project
cd C:\jizhang

# 2. Create local.properties if needed
echo sdk.dir=C:\\Users\\Administrator\\AppData\\Local\\Android\\Sdk > local.properties

# 3. Initial native project generation
npx expo prebuild --platform android --clean

# 4. Build Release APK
cd android
C:\gradle-9.3.1\bin\gradle.bat assembleRelease --no-daemon
```

### Regular Release Process

```bash
# Option A: Quick build with version prompt
quick-build.bat

# Option B: Manual version update then build
version.bat minor       # or major/patch/bump
cd android
C:\gradle-9.3.1\bin\gradle.bat assembleRelease --no-daemon
```

### After Code Changes

When modifying native dependencies or adding Expo modules:

```bash
# 1. Update native project
npx expo prebuild --platform android --clean

# 2. Build Release
cd android
C:\gradle-9.3.1\bin\gradle.bat assembleRelease --no-daemon
```

## Common Pitfalls & Solutions

### 1. Metro Bundler Issues

**Error:** "NODE_ENV not specified"
**Solution:** Always run `npx expo prebuild` before Gradle build

**Error:** "Bundler cache empty"
**Solution:** First build is always slow (~1-2 min), subsequent builds are faster

### 2. TypeScript Compilation Errors

**After changing types:**
```bash
npx tsc --noEmit
# Fix any errors before building APK
```

Common issues when removing icon field:
- Update `AppContextType` interface signatures
- Remove `icon` property from `PaymentMethod` everywhere
- Update `addPaymentMethod` function calls (remove icon argument)

### 3. CMake/Native Module Errors

**Error:** "subcommand failed" during clean
**Solution:** Use `npx expo prebuild --platform android --clean` instead of manual gradle clean

**Error:** "GLOB mismatch"
**Solution:** Delete `android/app/.cxx` directory and rebuild

### 4. Version Update Failures

**PowerShell execution policy blocked:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**JSON parsing error:**
- Ensure `package.json` is valid JSON
- Check no trailing commas

## Testing Checklist

Before each release:

- [ ] TypeScript compiles without errors: `npx tsc --noEmit`
- [ ] Version number updated in `package.json`
- [ ] CHANGELOG.md documents all changes
- [ ] Release notes written in RELEASE.md
- [ ] Native modules rebuilt if dependencies changed
- [ ] APK builds successfully: `assembleRelease --no-daemon`
- [ ] APK exists at `android/app/build/outputs/apk/release/app-release.apk`
- [ ] Test app installs and runs on device/emulator

## Release Distribution

After successful build:

```bash
# Locate final APK
android\app\build\outputs\apk\release\app-release.apk
# OR from quick-build:
jizhang-v[VERSION].apk (in project root)
```

Rename with clear version info:
- `jizhang-v1.0.7-release.apk`
- `jizhang-debug.apk` (for testing only)

## Related Skills

- `expo-android-local-release-build-skaffold` - Local build infrastructure
- `expo-payment-method-ui-optimization` - Payment method UX improvements
- `expo-android-release-build-gradle-931-java17` - Gradle 9.3.1 + Java 17 setup

## Future Improvements

Consider these enhancements:

1. **CI/CD Integration:** Automate builds with GitHub Actions
2. **Auto-changelog:** Integrate conventional commits tooling
3. **Signing configuration:** Add release key signing for production
4. **Version from git tags:** Derive version from `git describe --tags`
5. **Multi-platform builds:** iOS + Android in single command
6. **App Store upload:** Auto-upload to Google Play Console
