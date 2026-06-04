$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "          网站同步脚本" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

$localPath = $PWD.Path
$zipFile = "resume-temp.zip"
$server = "root@116.62.48.72"

Write-Host "`n本地路径: $localPath"
Write-Host "服务器地址: $server`n"

try {
    Write-Host "[1/4] 正在压缩文件..." -ForegroundColor Yellow
    if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
    Compress-Archive -Path "$localPath\*" -DestinationPath $zipFile -Force
    Write-Host "OK!`n" -ForegroundColor Green

    Write-Host "[2/4] 正在上传到服务器..." -ForegroundColor Yellow
    scp $zipFile "${server}:/root/"
    Write-Host "OK!`n" -ForegroundColor Green

    Write-Host "[3/4] 正在服务器上部署..." -ForegroundColor Yellow
    ssh $server "cd /root && unzip -o $zipFile -d resume-website && cd resume-website && npm install --production && pm2 reload resume-website"
    Write-Host "OK!`n" -ForegroundColor Green

    Write-Host "[4/4] 正在清理临时文件..." -ForegroundColor Yellow
    Remove-Item $zipFile -Force
    Write-Host "OK!`n" -ForegroundColor Green

    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host "          同步完成!" -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host "网站地址: http://116.62.48.72:3000`n" -ForegroundColor Green
}
catch {
    Write-Host "`nERROR: $_`n" -ForegroundColor Red
    if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
}

Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")