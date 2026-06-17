@echo off
chcp 65001 >nul

REM ================================
REM  记账 APP 版本管理脚本
REM ================================

setlocal enabledelayedexpansion

REM 获取当前版本号 (从 package.json)
for /f "tokens=3" %%i in ('findstr /c:"\"version\":" package.json') do set VERSION=%%i
set VERSION=%VERSION: =%
set VERSION=%VERSION:",%=

echo 当前版本号：%VERSION%

REM 检查参数
if "%~1"=="" goto usage
if "%~1"=="bump" goto bump
if "%~1"=="minor" goto minor
if "%~1"=="patch" goto patch
if "%~1"=="build" goto build

goto usage

:bump
REM 显示版本变更选项
echo.
echo 请选择版本号增量类型:
echo 1. major - 重大改动 (向后不兼容) X.Y.Z -> (X+1).0.0
echo 2. minor  - 新功能   (向后兼容)  X.Y.Z -> X.(Y+1).0
echo 3. patch  - Bug 修复  (向后兼容)  X.Y.Z -> X.Y.(Z+1)
echo.
set /p BUMP_TYPE="请输入选项 (1/2/3): "

if "%BUMP_TYPE%"=="1" goto bumpMajor
if "%BUMP_TYPE%"=="2" goto bumpMinor
if "%BUMP_TYPE%"=="3" goto bumpPatch

goto usage

:bumpMajor
REM 主版本号 +1, 次版本号归 0, 修订号归 0
for /f "tokens=1-3 delims=." %%i in ("%VERSION%") do (
    set /a newMajor=%%i + 1
    set newMinor=0
    set newPatch=0
    set NEW_VERSION=!newMajor!.!newMinor!.!newPatch!
)
goto updateVersion

:bumpMinor
REM 主版本号不变，次版本号 +1, 修订号归 0
for /f "tokens=1-3 delims=." %%i in ("%VERSION%") do (
    set newMajor=%%i
    set /a newMinor=%%j + 1
    set newPatch=0
    set NEW_VERSION=!newMajor!.!newMinor!.!newPatch!
)
goto updateVersion

:bumpPatch
REM 主版本号不变，次版本号不变，修订号 +1
for /f "tokens=1-3 delims=." %%i in ("%VERSION%") do (
    set newMajor=%%i
    set newMinor=%%j
    set /a newPatch=%%k + 1
    set NEW_VERSION=!newMajor!.!newMinor!.!newPatch!
)
goto updateVersion

:updateVersion
echo.
echo 新版本号：!NEW_VERSION!
set /p CONFIRM="确认更新版本号？(y/n): "
if /i not "!CONFIRM!"=="y" (
    echo 已取消
    goto end
)

REM 使用 sed 或简单替换更新 package.json
powershell -Command "(Get-Content package.json) -replace '\"version\":\s*\"[^\"]+\"', '\"version\": \"!NEW_VERSION!\"' | Set-Content package.json"

echo 版本号已更新为 !NEW_VERSION!
echo.
pause
goto end

:build
REM 构建 Release APK
echo.
echo ====== 开始构建 Release APK =======
cd android
C:\gradle-9.3.1\bin\gradle.bat assembleRelease --no-daemon
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====== 构建成功！=======
    echo APK 位置：app\build\outputs\apk\release\app-release.apk
    echo 版本号：!NEW_VERSION!
) else (
    echo.
    echo ====== 构建失败！=======
)
cd ..
goto end

:usage
echo.
echo 用法:
echo   version.bat              - 查看当前版本号
echo   version.bat [major|minor|patch] - 直接升级对应版本的号
echo   version.bat bump         - 交互式选择升级类型
echo   version.bat build        - 构建 Release APK
echo.
echo 版本规范 (语义化版本 SemVer):
echo   X.Y.Z
echo   X = 主版本号 (重大改动)
echo   Y = 次版本号 (新功能)
echo   Z = 修订号 (Bug 修复)
echo.
pause

:end
endlocal
