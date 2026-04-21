$paths = @(
    'C:\Program Files\Git\cmd\git.exe',
    'C:\Program Files\Git\bin\git.exe',
    'C:\Program Files (x86)\Git\cmd\git.exe',
    'C:\Program Files (x86)\Git\bin\git.exe',
    "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\bin\git.exe"
)

Write-Output "--- Checking standard locations ---"
foreach ($p in $paths) {
    if (Test-Path $p) { Write-Output $p }
}

Write-Output "--- Searching under Program Files (first 10 matches) ---"
Get-ChildItem 'C:\Program Files*' -Filter git.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName -First 10

Write-Output "--- Searching under user AppData (first 10 matches) ---"
Get-ChildItem "$env:USERPROFILE\AppData" -Filter git.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName -First 10
