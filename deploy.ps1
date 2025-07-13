# deploy-landing.ps1
param(
    [string]$ServerIP = "93.149.220.80",
    [string]$Username = "jaco",
    [string]$LocalPath = "./src/pages/Landing/*",
    [string]$TempPath = "/home/jaco/temp-landing/",
    [string]$FinalPath = "/var/www/booksnap/landing/"
)

Write-Host "Avvio deploy della landing page..." -ForegroundColor Green

# Passo 1: Crea directory temporanea sul server
Write-Host "Preparazione directory temporanea..." -ForegroundColor Yellow
ssh $Username@$ServerIP "mkdir -p /home/jaco/temp-landing/"

# Passo 2: Upload dei file
Write-Host "Upload dei file..." -ForegroundColor Yellow
scp -r $LocalPath ${Username}@${ServerIP}:$TempPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "Upload completato con successo!" -ForegroundColor Green
    
    # Passo 3: Spostamento con privilegi sudo (comando singolo per evitare \r)
    Write-Host "Spostamento nella directory finale..." -ForegroundColor Yellow
    $sshCommand = "sudo rm -rf /var/www/booksnap/landing/* && sudo cp -r /home/jaco/temp-landing/* /var/www/booksnap/landing/ && sudo chown -R caddy:caddy /var/www/booksnap/landing/ && sudo chmod -R 755 /var/www/booksnap/landing/ && rm -rf /home/jaco/temp-landing/* && echo 'Deploy completato con successo'"
    
    ssh $Username@$ServerIP $sshCommand
    
    Write-Host "Deploy della landing page completato!" -ForegroundColor Green
    Write-Host "Verifica su: https://booksnap.it/info/" -ForegroundColor Cyan
    
} else {
    Write-Host "Errore durante upload!" -ForegroundColor Red
    exit 1
}
