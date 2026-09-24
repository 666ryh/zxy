$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$taskData=Join-Path $projectRoot 'server\data\mysql'
if(!(Test-Path -LiteralPath (Join-Path $taskData 'auto.cnf'))){throw 'MySQL data directory is not initialized. See deployment documentation.'}
if(Get-NetTCPConnection -LocalPort 3307 -State Listen -ErrorAction SilentlyContinue){Write-Host 'Port 3307 is already listening. No process changed.';exit 0}
$taskBase='D:/mysql-8.3.0-winx64'
$taskDataUnix=$taskData.Replace('\','/')
Start-Process -FilePath "$taskBase/bin/mysqld.exe" -ArgumentList @('--no-defaults',"--basedir=$taskBase","--datadir=$taskDataUnix",'--port=3307','--bind-address=127.0.0.1','--mysqlx=OFF','--max-allowed-packet=32M',"--log-error=$taskDataUnix/server.log","--pid-file=$taskDataUnix/server.pid") -WindowStyle Hidden
Write-Host 'Project MySQL starting on 127.0.0.1:3307.'
