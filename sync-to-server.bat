@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ===============================
echo    网站同步脚本
echo ===============================
echo.

:: 检查是否安装了 SSH
where ssh >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: 未找到 SSH，请安装 OpenSSH 或配置环境变量
    pause
    exit /b 1
)

:: 设置路径
set "localPath=%~dp0"
set "zipFile=resume-temp.zip"
set "server=root@116.62.48.72"
set "serverPath=/root/resume-website"

echo 本地路径: %localPath%
echo 服务器地址: %server%
echo 目标路径: %serverPath%
echo.

:: 步骤1: 压缩文件
echo [1/4] 正在压缩文件...
powershell.exe -Command "Compress-Archive -Path '%localPath%\*' -DestinationPath '%localPath%\%zipFile%' -Force"
if %errorlevel% neq 0 (
    echo ERROR: 压缩失败
    pause
    exit /b 1
)
echo OK!

:: 步骤2: 上传到服务器
echo [2/4] 正在上传到服务器...
scp "%localPath%\%zipFile%" %server%:/root/
if %errorlevel% neq 0 (
    echo ERROR: 上传失败，请检查 SSH 连接和服务器配置
    del "%localPath%\%zipFile%" 2>nul
    pause
    exit /b 1
)
echo OK!

:: 步骤3: 在服务器上解压并重启
echo [3/4] 正在服务器上部署...
ssh %server% "cd /root && unzip -o %zipFile% -d resume-website && cd resume-website && npm install --production && pm2 reload resume-website"
if %errorlevel% neq 0 (
    echo ERROR: 服务器部署失败
    del "%localPath%\%zipFile%" 2>nul
    pause
    exit /b 1
)
echo OK!

:: 步骤4: 清理临时文件
echo [4/4] 正在清理临时文件...
del "%localPath%\%zipFile%" 2>nul
echo OK!

echo.
echo ===============================
echo    同步完成!
echo ===============================
echo 网站地址: http://116.62.48.72:3000
echo.
pause