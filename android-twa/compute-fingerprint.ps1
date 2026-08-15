param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Password
)
Add-Type -AssemblyName System.Security
$c = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
$c.Import($Path, $Password, [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::DefaultKeySet)
$sha = [System.Security.Cryptography.SHA256]::Create()
$hash = $sha.ComputeHash($c.GetRawCertData())
$fp = (($hash | ForEach-Object { $_.ToString('X2') }) -join ':')
Write-Output "Fingerprint: $fp"
Write-Output "Subject: $($c.Subject)"
Write-Output "NotAfter: $($c.NotAfter)"
