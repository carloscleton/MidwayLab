[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "         MIDWAYLAB - STATUS DO ROBO DE PRODUCAO         " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verifica processo em execucao
$procs = Get-CimInstance Win32_Process | Where-Object { 
    $_.CommandLine -like "*midwaylab-robo-tray*" -or $_.CommandLine -like "*agent-service*" 
}

if ($procs) {
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "  [ONLINE] O ROBO MIDWAY ESTA ATIVO E MONITORANDO 24H!" -ForegroundColor Green
    foreach ($p in $procs) {
        Write-Host "  -> Processo Ativo (PID: $($p.ProcessId))" -ForegroundColor Green
    }
    Write-Host "  -> Icone visivel na bandeja do sistema (junto ao relogio)" -ForegroundColor Gray
    Write-Host "  -> Monitorando C:\MidwayLab e convertendo exames" -ForegroundColor Gray
    Write-Host "========================================================" -ForegroundColor Green
} else {
    Write-Host "========================================================" -ForegroundColor Yellow
    Write-Host "  [OFFLINE] O ROBO NAO ESTA RODANDO NO MOMENTO." -ForegroundColor Yellow
    Write-Host "  -> Para ligar, use a opcao [1] abaixo ou execute:" -ForegroundColor White
    Write-Host "     C:\MidwayLab\2_INICIAR_ROBO_BANDEJA.bat" -ForegroundColor Cyan
    Write-Host "========================================================" -ForegroundColor Yellow
}

# 2. Verifica agendamento 24h
Write-Host ""
$tarefa = schtasks /query /tn "MidwayAgent" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [AUTO 24H] Servico automatico 'MidwayAgent' configurado no Windows!" -ForegroundColor Green
} else {
    Write-Host "  [AUTO 24H] Inicializacao automatica ainda nao configurada como tarefa." -ForegroundColor Gray
}
Write-Host ""
