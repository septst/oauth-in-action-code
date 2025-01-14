param(
[string]$folder,
[bool]$npmInstallOnly=$false
)

Write-Host $folder

Write-Host 'Navigating to '$folder
cd C:\repos\oauth-in-action-code\exercises\$folder

Write-Host "Running npm install"
npm install


if($npmInstallOnly -eq $false){
Write-Host "starting authorizationServer..."
# node .\authorizationServer.js
invoke-expression 'cmd /c start powershell -Command { Write-Host "***************Authorization Server**************"; node .\authorizationServer.js }'
Write-Host "Starting client..."
invoke-expression 'cmd /c start powershell -Command { Write-Host "***************Client**************"; node .\client.js }'
# node .\client.js
Write-Host "Starting Protected Resource..."
invoke-expression 'cmd /c start powershell -Command { Write-Host "***************Protected Resource**************"; node .\protectedResource.js }'
# node .\protectedResource.js

Write-Host "Open new chrome window"
Start-Process  -FilePath Chrome 
Write-Host "Launching authorizationServer..."
Start-Process -FilePath Chrome -ArgumentList http://127.0.0.1:9000
Write-Host "Launching Client..."
Start-Process -FilePath Chrome -ArgumentList http://127.0.0.1:9001
Write-Host "Launching Protected Resource..."
Start-Process -FilePath Chrome -ArgumentList http://127.0.0.1:9002 
}else{
Write-Host "***********npm install complete***************"
}
