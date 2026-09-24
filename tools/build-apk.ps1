$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$sdkRoot = Join-Path $projectRoot 'work\sdk'
$toolsRoot = Join-Path $sdkRoot 'tools\android-14'
$platformJar = Join-Path $sdkRoot 'platform\android-34\android.jar'
$javaRoot = 'C:\Program Files\Java\jdk-17'
$buildRoot = Join-Path $projectRoot ('build\apk-' + [Guid]::NewGuid().ToString('N'))
$sourceRoot = Join-Path $projectRoot 'android\app\src\main'
function Run-Checked([string]$exe,[string[]]$arguments) { & $exe @arguments; if ($LASTEXITCODE -ne 0) { throw "Command failed: $exe ($LASTEXITCODE)" } }
if (!(Test-Path -LiteralPath $platformJar)) {throw 'SDK missing: see README.md'}
Push-Location $projectRoot
try {Run-Checked 'npm.cmd' @('run','build:h5')} finally {Pop-Location}
Run-Checked 'py.exe' @('-3.11',"$projectRoot\tools\prepare-h5-apk.py", "$projectRoot\dist\build\h5")
New-Item -ItemType Directory -Force -Path "$buildRoot\compiled", "$buildRoot\classes", "$buildRoot\dex", "$buildRoot\assets\web", "$projectRoot\releases" | Out-Null
Copy-Item -Path "$projectRoot\dist\build\h5\*" -Destination "$buildRoot\assets\web" -Recurse -Force
Run-Checked "$toolsRoot\aapt2.exe" @('compile','--dir',"$sourceRoot\res",'-o',"$buildRoot\compiled\resources.zip")
Run-Checked "$toolsRoot\aapt2.exe" @('link','-o',"$buildRoot\unsigned.apk",'-I',$platformJar,'--manifest',"$sourceRoot\AndroidManifest.xml",'--min-sdk-version','26','--target-sdk-version','34', "$buildRoot\compiled\resources.zip")
Run-Checked 'py.exe' @('-3.11',"$projectRoot\tools\normalize-apk-assets.py", "$buildRoot\unsigned.apk", "$buildRoot\assets\web")
Run-Checked "$javaRoot\bin\javac.exe" @('-encoding','UTF-8','--release','8','-classpath',$platformJar,'-d',"$buildRoot\classes", "$sourceRoot\java\cn\kejian\teacher\MainActivity.java", "$sourceRoot\java\cn\kejian\teacher\AssetRoutes.java")
Run-Checked "$javaRoot\bin\jar.exe" @('cf',"$buildRoot\classes.jar",'-C',"$buildRoot\classes",'.')
Run-Checked "$toolsRoot\d8.bat" @('--lib',$platformJar,'--min-api','26','--output',"$buildRoot\dex", "$buildRoot\classes.jar")
Push-Location "$buildRoot\dex"
try {Run-Checked "$toolsRoot\aapt.exe" @('add',"$buildRoot\unsigned.apk",'classes.dex')} finally {Pop-Location}
Run-Checked "$toolsRoot\zipalign.exe" @('-f','4',"$buildRoot\unsigned.apk", "$buildRoot\aligned.apk")
$keyPath = Join-Path $projectRoot 'work\kejian-local.keystore'
if (!(Test-Path -LiteralPath $keyPath)) {Run-Checked "$javaRoot\bin\keytool.exe" @('-genkeypair','-keystore',$keyPath,'-storepass','android','-keypass','android','-alias','kejian','-keyalg','RSA','-keysize','2048','-validity','10000','-dname','CN=Kejian Local, O=Personal, C=CN')}
$apk = Join-Path $projectRoot 'releases\kejian-3.0.4.apk'
Run-Checked "$toolsRoot\apksigner.bat" @('sign','--ks',$keyPath,'--ks-pass','pass:android','--key-pass','pass:android','--out',$apk,"$buildRoot\aligned.apk")
Run-Checked "$toolsRoot\apksigner.bat" @('verify','--verbose',$apk)
Run-Checked "$javaRoot\bin\javac.exe" @('-encoding','UTF-8','--release','8','-d',"$buildRoot\route-tests", "$sourceRoot\java\cn\kejian\teacher\AssetRoutes.java", "$projectRoot\tests\AssetRoutesTest.java")
Run-Checked "$javaRoot\bin\java.exe" @('-cp',"$buildRoot\route-tests",'cn.kejian.teacher.AssetRoutesTest',$apk)
Get-FileHash -LiteralPath $apk -Algorithm SHA256
Write-Host "APK: $apk"
