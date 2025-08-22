#Requires -Version 5.1

param(
    [ValidateSet('frontend', 'landing', 'librerie', 'biblioteche', 'all')]
    [string]$DeployType = 'all',
    
    [switch]$SkipBuild,
    
    [string]$ServerIP = '217.154.2.235',
    
    [string]$Username = 'jaco'
)

# =====================================================
# CONFIGURAZIONE GLOBALE
# =====================================================

$ErrorActionPreference = 'Stop'

$Config = @{
    ServerIP = $ServerIP
    Username = $Username
    SSHTarget = "${Username}@${ServerIP}"
    
    FrontendLocalPath = './dist/*'
    LandingLocalPath = './src/pages/Landing/*'
    LibrerieLocalPath = './librerie/*'
    BibliotecheLocalPath = './biblioteche/*'
    
    TempFrontendPath = '/home/jaco/temp-frontend/'
    TempLandingPath = '/home/jaco/temp-landing/'
    TempLibreriePath = '/home/jaco/temp-librerie/'
    TempBibliotechePath = '/home/jaco/temp-biblioteche/'
    
    FinalFrontendPath = '/var/www/booksnap/'
    FinalLandingPath = '/var/www/booksnap/landing/'
    FinalLibreriePath = '/var/www/booksnap/librerie/'
    FinalBibliotechePath = '/var/www/booksnap/biblioteche/'
}

# =====================================================
# FUNZIONI DI UTILITÀ
# =====================================================

function Write-DeployLog {
    param(
        [string]$Message,
        [ValidateSet('Info', 'Success', 'Warning', 'Error')]
        [string]$Type = 'Info'
    )
    
    $colors = @{
        'Info' = 'Cyan'
        'Success' = 'Green'
        'Warning' = 'Yellow'
        'Error' = 'Red'
    }
    
    $prefix = @{
        'Info' = '[INFO]'
        'Success' = '[OK]'
        'Warning' = '[WARN]'
        'Error' = '[ERROR]'
    }
    
    Write-Host "$($prefix[$Type]) $Message" -ForegroundColor $colors[$Type]
}

function Test-ServerConnection {
    Write-DeployLog "Test connessione server..." "Info"
    
    try {
        $result = & ssh $Config.SSHTarget "echo 'OK'"
        if ($LASTEXITCODE -eq 0) {
            Write-DeployLog "Connessione SSH riuscita" "Success"
            return $true
        }
    }
    catch {
        Write-DeployLog "Errore connessione: $_" "Error"
    }
    
    return $false
}

function Build-Frontend {
    if ($SkipBuild) {
        Write-DeployLog "Build saltata" "Warning"
        if (-not (Test-Path 'dist')) {
            Write-DeployLog "Directory dist mancante" "Error"
            return $false
        }
        return $true
    }
    
    Write-DeployLog "Avvio build frontend..." "Info"
    
    if (-not (Test-Path 'package.json')) {
        Write-DeployLog "File package.json non trovato" "Error"
        return $false
    }
    
    # Installa dipendenze se necessario
    if (-not (Test-Path 'node_modules')) {
        Write-DeployLog "Installazione dipendenze..." "Info"
        & npm install
        if ($LASTEXITCODE -ne 0) {
            Write-DeployLog "Errore installazione dipendenze" "Error"
            return $false
        }
    }
    
    # Build del progetto
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-DeployLog "Errore durante la build" "Error"
        return $false
    }
    
    # Verifica build
    if (-not (Test-Path 'dist/index.html')) {
        Write-DeployLog "Build incompleta: index.html mancante" "Error"
        return $false
    }
    
    $jsFiles = @(Get-ChildItem -Path 'dist' -Filter '*.js' -Recurse)
    if ($jsFiles.Count -eq 0) {
        Write-DeployLog "Build incompleta: file JavaScript mancanti" "Error"
        return $false
    }
    
    Write-DeployLog "Build completata: $($jsFiles.Count) file JS trovati" "Success"
    return $true
}

function Deploy-Frontend {
    Write-DeployLog "Deploy frontend..." "Info"
    
    if (-not (Test-Path 'dist')) {
        Write-DeployLog "Directory dist non trovata" "Error"
        return $false
    }
    
    # Prepara directory sul server
    & ssh $Config.SSHTarget "rm -rf $($Config.TempFrontendPath) && mkdir -p $($Config.TempFrontendPath)"
    
    # Upload file
    Write-DeployLog "Upload file..." "Info"
    & scp -r $Config.FrontendLocalPath "$($Config.SSHTarget):$($Config.TempFrontendPath)"
    
    if ($LASTEXITCODE -ne 0) {
        Write-DeployLog "Errore upload frontend" "Error"
        return $false
    }
    
    # Deploy finale
    $deployCommand = @"
sudo cp -r $($Config.FinalFrontendPath) /var/www/booksnap.backup.`$(date +%Y%m%d_%H%M%S) 2>/dev/null || true && 
sudo rm -rf $($Config.FinalFrontendPath)* && 
sudo cp -r $($Config.TempFrontendPath)* $($Config.FinalFrontendPath) && 
sudo chown -R caddy:caddy $($Config.FinalFrontendPath) && 
sudo chmod -R 755 $($Config.FinalFrontendPath) && 
rm -rf $($Config.TempFrontendPath)* && 
echo 'Frontend deploy OK'
"@
    
    $result = & ssh $Config.SSHTarget $deployCommand
    if ($LASTEXITCODE -ne 0) {
        Write-DeployLog "Errore deploy finale frontend" "Error"
        return $false
    }
    
    Write-DeployLog "Deploy frontend completato" "Success"
    return $true
}

function Deploy-Landing {
    Write-DeployLog "Deploy landing page..." "Info"
    
    if (-not (Test-Path 'src/pages/Landing/index.html')) {
        Write-DeployLog "File landing/index.html non trovato" "Error"
        return $false
    }
    
    # Prepara directory sul server
    & ssh $Config.SSHTarget "rm -rf $($Config.TempLandingPath) && mkdir -p $($Config.TempLandingPath)"
    
    # Upload file
    Write-DeployLog "Upload landing page..." "Info"
    & scp -r $Config.LandingLocalPath "$($Config.SSHTarget):$($Config.TempLandingPath)"
    
    if ($LASTEXITCODE -ne 0) {
        Write-DeployLog "Errore upload landing" "Error"
        return $false
    }
    
    # Deploy finale
    $deployCommand = @"
sudo mkdir -p $($Config.FinalLandingPath) && 
sudo rm -rf $($Config.FinalLandingPath)* && 
sudo cp -r $($Config.TempLandingPath)* $($Config.FinalLandingPath) && 
sudo chown -R caddy:caddy $($Config.FinalLandingPath) && 
sudo chmod -R 755 $($Config.FinalLandingPath) && 
rm -rf $($Config.TempLandingPath)* && 
echo 'Landing deploy OK'
"@
    
    $result = & ssh $Config.SSHTarget $deployCommand
    if ($LASTEXITCODE -ne 0) {
        Write-DeployLog "Errore deploy finale landing" "Error"
        return $false
    }
    
    Write-DeployLog "Deploy landing page completato" "Success"
    return $true
}

function Deploy-Librerie {
    Write-DeployLog "Deploy pagina librerie..." "Info"
    
    if (-not (Test-Path 'librerie/index.html')) {
        Write-DeployLog "File librerie/index.html non trovato" "Error"
        return $false
    }
    
    # Prepara directory sul server
    & ssh $Config.SSHTarget "rm -rf $($Config.TempLibreriePath) && mkdir -p $($Config.TempLibreriePath)"
    
    # Upload file
    Write-DeployLog "Upload pagina librerie..." "Info"
    & scp -r $Config.LibrerieLocalPath "$($Config.SSHTarget):$($Config.TempLibreriePath)"
    
    if ($LASTEXITCODE -ne 0) {
        Write-DeployLog "Errore upload librerie" "Error"
        return $false
    }
    
    # Deploy finale
    $deployCommand = @"
sudo mkdir -p $($Config.FinalLibreriePath) && 
sudo rm -rf $($Config.FinalLibreriePath)* && 
sudo cp -r $($Config.TempLibreriePath)* $($Config.FinalLibreriePath) && 
sudo chown -R caddy:caddy $($Config.FinalLibreriePath) && 
sudo chmod -R 755 $($Config.FinalLibreriePath) && 
rm -rf $($Config.TempLibreriePath)* && 
echo 'Librerie deploy OK'
"@
    
    $result = & ssh $Config.SSHTarget $deployCommand
    if ($LASTEXITCODE -ne 0) {
        Write-DeployLog "Errore deploy finale librerie" "Error"
        return $false
    }
    
    Write-DeployLog "Deploy pagina librerie completato" "Success"
    return $true
}

function Deploy-Biblioteche {
    Write-DeployLog "Deploy pagina biblioteche..." "Info"
    
    if (-not (Test-Path 'biblioteche/index.html')) {
        Write-DeployLog "File biblioteche/index.html non trovato" "Error"
        return $false
    }
    
    # Prepara directory sul server
    & ssh $Config.SSHTarget "rm -rf $($Config.TempBibliotechePath) && mkdir -p $($Config.TempBibliotechePath)"
    
    # Upload file
    Write-DeployLog "Upload pagina biblioteche..." "Info"
    & scp -r $Config.BibliotecheLocalPath "$($Config.SSHTarget):$($Config.TempBibliotechePath)"
    
    if ($LASTEXITCODE -ne 0) {
        Write-DeployLog "Errore upload biblioteche" "Error"
        return $false
    }
    
    # Deploy finale
    $deployCommand = @"
sudo mkdir -p $($Config.FinalBibliotechePath) && 
sudo rm -rf $($Config.FinalBibliotechePath)* && 
sudo cp -r $($Config.TempBibliotechePath)* $($Config.FinalBibliotechePath) && 
sudo chown -R caddy:caddy $($Config.FinalBibliotechePath) && 
sudo chmod -R 755 $($Config.FinalBibliotechePath) && 
rm -rf $($Config.TempBibliotechePath)* && 
echo 'Biblioteche deploy OK'
"@
    
    $result = & ssh $Config.SSHTarget $deployCommand
    if ($LASTEXITCODE -ne 0) {
        Write-DeployLog "Errore deploy finale biblioteche" "Error"
        return $false
    }
    
    Write-DeployLog "Deploy pagina biblioteche completato" "Success"
    return $true
}

function Test-Deployment {
    Write-DeployLog "Verifica deploy..." "Info"
    
    # Test sito principale
    try {
        $response = Invoke-WebRequest -Uri 'https://booksnap.it' -Method Head -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-DeployLog "Sito principale: OK" "Success"
        }
    }
    catch {
        Write-DeployLog "Sito principale: Errore" "Warning"
    }
    
    # Test landing page
    if ($DeployType -in @('landing', 'all')) {
        try {
            $response = Invoke-WebRequest -Uri 'https://booksnap.it/landing/' -Method Head -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-DeployLog "Landing page: OK" "Success"
            }
        }
        catch {
            Write-DeployLog "Landing page: Errore" "Warning"
        }
    }
    
    # Test pagina librerie
    if ($DeployType -in @('librerie', 'all')) {
        try {
            $response = Invoke-WebRequest -Uri 'https://booksnap.it/librerie/' -Method Head -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-DeployLog "Pagina librerie: OK" "Success"
            }
        }
        catch {
            Write-DeployLog "Pagina librerie: Errore" "Warning"
        }
    }
    
    # Test pagina biblioteche
    if ($DeployType -in @('biblioteche', 'all')) {
        try {
            $response = Invoke-WebRequest -Uri 'https://booksnap.it/biblioteche/' -Method Head -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-DeployLog "Pagina biblioteche: OK" "Success"
            }
        }
        catch {
            Write-DeployLog "Pagina biblioteche: Errore" "Warning"
        }
    }
    
    # Test API
    try {
        $response = Invoke-WebRequest -Uri 'https://booksnap.it/api/analyze-book' -Method Head -TimeoutSec 10 -UseBasicParsing
        Write-DeployLog "API Backend: OK" "Success"
    }
    catch {
        Write-DeployLog "API Backend: Disponibile" "Info"
    }
}

# =====================================================
# MAIN EXECUTION
# =====================================================

function Main {
    # Banner semplice senza caratteri Unicode
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "          BOOKSNAP DEPLOY AUTOMATICO          " -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "Deploy Type: $DeployType | Server: $($Config.ServerIP)" -ForegroundColor Cyan
    Write-Host ""
    
    $startTime = Get-Date
    
    try {
        # Test connessione
        if (-not (Test-ServerConnection)) {
            throw "Connessione server fallita"
        }
        
        # Build frontend
        if ($DeployType -in @('frontend', 'all')) {
            if (-not (Build-Frontend)) {
                throw "Build frontend fallita"
            }
        }
        
        # Deploy frontend
        if ($DeployType -in @('frontend', 'all')) {
            if (-not (Deploy-Frontend)) {
                throw "Deploy frontend fallito"
            }
        }
        
        # Deploy landing
        if ($DeployType -in @('landing', 'all')) {
            if (-not (Deploy-Landing)) {
                throw "Deploy landing fallito"
            }
        }
        
        # Deploy librerie
        if ($DeployType -in @('librerie', 'all')) {
            if (-not (Deploy-Librerie)) {
                throw "Deploy librerie fallito"
            }
        }
        
        # Deploy biblioteche
        if ($DeployType -in @('biblioteche', 'all')) {
            if (-not (Deploy-Biblioteche)) {
                throw "Deploy biblioteche fallito"
            }
        }
        
        # Test finale
        Test-Deployment
        
        $elapsed = (Get-Date) - $startTime
        Write-DeployLog "Deploy completato in $($elapsed.ToString('mm\:ss'))" "Success"
        
        Write-Host ""
        Write-Host "================================================" -ForegroundColor Green
        Write-Host "             DEPLOY COMPLETATO!               " -ForegroundColor Green
        Write-Host "================================================" -ForegroundColor Green
        Write-Host "Sito disponibile: https://booksnap.it" -ForegroundColor White
        if ($DeployType -in @('landing', 'all')) {
            Write-Host "Landing page:     https://booksnap.it/landing/" -ForegroundColor White
        }
        if ($DeployType -in @('librerie', 'all')) {
            Write-Host "Pagina librerie:  https://booksnap.it/librerie/" -ForegroundColor White
        }
        if ($DeployType -in @('biblioteche', 'all')) {
            Write-Host "Pagina biblioteche: https://booksnap.it/biblioteche/" -ForegroundColor White
        }
        Write-Host ""
        
    }
    catch {
        Write-DeployLog "DEPLOY FALLITO: $($_.Exception.Message)" "Error"
        
        Write-Host ""
        Write-Host "================================================" -ForegroundColor Red
        Write-Host "               DEPLOY FALLITO                 " -ForegroundColor Red
        Write-Host "================================================" -ForegroundColor Red
        
        exit 1
    }
}

# Avvia il deploy se lo script viene eseguito direttamente
if ($MyInvocation.InvocationName -ne '.') {
    Main
}
