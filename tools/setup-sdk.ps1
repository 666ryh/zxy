$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$sdkRoot=Join-Path $projectRoot 'work\sdk'
New-Item -ItemType Directory -Force -Path $sdkRoot | Out-Null
$packages=@(
 @{Name='platform';Url='https://dl.google.com/android/repository/platform-34-ext7_r03.zip';Hash='1f2e9478d6a7601425ceaa553311dc43191f103d';Destination='platform'},
 @{Name='build-tools';Url='https://dl.google.com/android/repository/build-tools_r34-windows.zip';Hash='62cfde1b6fcc3ad12a4d2ba1b537e752768bfd47';Destination='tools'}
)
foreach($package in $packages){
 $zip=Join-Path $sdkRoot ($package.Name+'.zip')
 if(!(Test-Path -LiteralPath $zip)){Invoke-WebRequest -UseBasicParsing -Uri $package.Url -OutFile $zip}
 if((Get-FileHash -LiteralPath $zip -Algorithm SHA1).Hash -ne $package.Hash){throw "SDK checksum mismatch: $zip"}
 Expand-Archive -LiteralPath $zip -DestinationPath (Join-Path $sdkRoot $package.Destination) -Force
}
Write-Host 'Android SDK 34 ready.'
