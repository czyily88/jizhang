@echo off
chcp 65001 >nul
REM ============================================
REM  快速构建 APK（带自动版本升级）
REM ============================================

setlocal enabledelayedexpansion

echo ============================================
echo      记账 APP - 快速打包工具
echo ============================================
echo.

REM 检查 package.json 是否存在
if not exist "package.json" (
    echo 错误：找不到 package.json
    pause
    exit /b 1
)

REM 获取当前版本号
for /f "tokens=3" %%i in ('findstr /c:"\"version\":" package.json') do set VERSION=%%i
set VERSION=%VERSION: =%
set VERSION=%VERSION:",%=

echo 当前版本：%VERSION%
echo.

REM 询问是否需要升级版本
set /p NEED_BUMP="是否需要升级版本号？(y/n): "
if /i "%NEED_BUMP%"=="y" (
    echo.
    echo 请选择升级类型:
    echo [1] major - 重大改动 (主版本号 +1)
    echo [2] minor - 新功能   (次版本号 +1)
    echo [3] patch - Bug 修复 (修订号 +1)
    echo.
    set /p BUMP_TYPE="请输入选项 (1/2/3): "
    
    if "%BUMP_TYPE%"=="1" (
        for /f "tokens=1-3 delims=." %%i in ("%VERSION%") do set NEW_VERSION=%%i+1.0.0
        powershell -Command "(Get-Content package.json) -replace '\"version\":\s*\"[^\"]+\"', '\"version\": \"%%i+1.0.0\"' | Set-Content package.json"
        goto applyNewVersion
    )
    
    if "%BUMP_TYPE%"=="2" (
        for /f "tokens=1-3 delims=." %%i in ("%VERSION%") do set /a newMinor=%%j+1, NEW_VERSION=%%i.!newMinor!.0
        powershell -Command "(Get-Content package.json) -replace '\"version\":\s*\"[^\"]+\"', '\"version\": \"!NEW_VERSION!\"' | Set-Content package.json"
        goto applyNewVersion
    )
    
    if "%BUMP_TYPE%"=="3" (
        for /f "tokens=1-3 delims=." %%i in ("%VERSION%") do set /a newPatch=%%k+1, NEW_VERSION=%%i.%%j.!newPatch!
        powershell -Command "(Get-Content package.json) -replace '\"version\":\s*\"[^\"]+\"', '\"version\": \"!NEW_VERSION!\"' | Set-Content package.json"
        goto applyNewVersion
    )
    
    echo 无效的选项，保持原版本号
)

:applyNewVersion

REM 重新生成 native 项目（如果有需要）
set /p REBUILD_NATIVE="是否需要重新生成 native 项目？(y/n): "
if /i "%REBUILD_NATIVE%"=="y" (
    echo 正在重新生成 native 项目...
    npx expo prebuild --platform android --clean
)

echo.
echo ============================================
echo       开始构建 Release APK...
echo ============================================
cd android

C:\gradle-9.3.1\bin\gradle.bat assembleRelease --no-daemon
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================
    echo ✅  构建成功！
    echo ================================
    echo APK 路径：app\build\outputs\apk\release\app-release.apk
    echo 新版本号：%NEW_VERSION%
    
    REM 复制 APK 到项目根目录便于访问
    if not defined NEW_VERSION set NEW_VERSION=%VERSION%
    copy /y app\build\outputs\apk\release\app-release.apk ..\jizhang-v%NEW_VERSION%.apk
    
    echo.
    echo 已复制 APK 到：..\jizhang-v%NEW_VERSION%.apk
) else (
    echo.
    echo ❌ 构建失败！
    cd ..
    pause
    exit /b 1
)

cd ..

pause
