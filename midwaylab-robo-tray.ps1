# ==============================================================================
# MIDWAYLAB - ROBO AGENTE DE BANDEJA (SYSTEM TRAY / RELOGIO)
# Roda nativamente no Windows sem precisar de Node.js ou instaladores complexos.
# ==============================================================================

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls11 -bor [System.Net.SecurityProtocolType]::Tls

# Leitura de configuracoes locais do arquivo .env
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvFile = Join-Path $ScriptDir ".env"

$ApiUrl = "http://localhost:3000"
$AgentToken = ""
$Equipamento = "SYSMEX_UF_1500"
$PastaRaiz = "C:\MidwayLab"

if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and !$line.StartsWith("#")) {
            $parts = $line.Split("=", 2)
            if ($parts.Length -eq 2) {
                $k = $parts[0].Trim()
                $v = $parts[1].Trim()
                if ($k -eq "MIDWAY_API_URL") { $ApiUrl = $v.TrimEnd("/") }
                if ($k -eq "MIDWAY_AGENT_TOKEN") { $AgentToken = $v }
                if ($k -eq "EQUIPAMENTO") { $Equipamento = $v }
                if ($k -eq "PASTA_RAIZ") { $PastaRaiz = $v }
            }
        }
    }
}

# Estrutura Oficial de Pastas do MidwayLab
$DirEntrada = Join-Path $PastaRaiz "Labfacil\$Equipamento\Entrada"
$DirProcessados = Join-Path $PastaRaiz "Labfacil\$Equipamento\Processados"
$DirErros = Join-Path $PastaRaiz "Labfacil\$Equipamento\Erros"
$DirCarga = Join-Path $PastaRaiz "Equipamentos\$Equipamento\Carga"
$DirResultados = Join-Path $PastaRaiz "Equipamentos\$Equipamento\Resultados"

# Garante a criacao fisica das pastas
@($DirEntrada, $DirProcessados, $DirErros, $DirCarga, $DirResultados) | ForEach-Object {
    if (!(Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}

# Criacao do Icone na Bandeja do Windows (proximo ao relogio)
$NotifyIcon = New-Object System.Windows.Forms.NotifyIcon
$NotifyIcon.Icon = [System.Drawing.SystemIcons]::Application
$NotifyIcon.Text = "MidwayLab - Robo de Integracao ($Equipamento)"
$NotifyIcon.Visible = $true

# Menu de contexto ao clicar com botao direito no icone
$ContextMenu = New-Object System.Windows.Forms.ContextMenuStrip

$MenuItemStatus = $ContextMenu.Items.Add("STATUS: Ativo e Monitorando")
$MenuItemStatus.Enabled = $false

$ContextMenu.Items.Add("-") | Out-Null

$MenuItemAbrirPastas = $ContextMenu.Items.Add("Abrir Pastas do MidwayLab")
$MenuItemAbrirPastas.add_Click({
    Start-Process "explorer.exe" $PastaRaiz
})

$MenuItemVarrer = $ContextMenu.Items.Add("Varrer Pastas Agora")
$MenuItemVarrer.add_Click({
    Executar-Varredura
})

$MenuItemWeb = $ContextMenu.Items.Add("Abrir Painel MidwayLab Web")
$MenuItemWeb.add_Click({
    Start-Process $ApiUrl
})

$ContextMenu.Items.Add("-") | Out-Null

$MenuItemSair = $ContextMenu.Items.Add("Encerrar Robo")
$MenuItemSair.add_Click({
    $NotifyIcon.Visible = $false
    [System.Windows.Forms.Application]::Exit()
})

$NotifyIcon.ContextMenuStrip = $ContextMenu

# Mostra notificacao balao inicial informando ativacao
$NotifyIcon.ShowBalloonTip(
    4000,
    "MidwayLab Ativo!",
    "Monitorando $Equipamento em C:\MidwayLab. Icone ativo junto ao relogio.",
    [System.Windows.Forms.ToolTipIcon]::Info
)

# Funcao de Varredura e Processamento
function Executar-Varredura {
    if (!(Test-Path $DirEntrada)) { return }

    $arquivos = Get-ChildItem -Path $DirEntrada -Filter "*.*" | Where-Object { 
        $ext = $_.Extension.ToLower()
        ($ext -eq ".xml" -or $ext -eq ".json") -and !$_.Name.StartsWith("tmp_")
    }

    foreach ($arq in $arquivos) {
        $caminhoArquivo = $arq.FullName
        $nomeArquivo = $arq.Name

        try {
            # Le conteudo do arquivo com encoding UTF-8
            $conteudo = [System.IO.File]::ReadAllText($caminhoArquivo, [System.Text.Encoding]::UTF8)
            if ([string]::IsNullOrWhiteSpace($conteudo)) { continue }

            # Envia para a API do MidwayLab processar e converter
            $headers = @{
                "Content-Type" = "application/json"
            }
            if ($AgentToken) {
                $headers["x-agent-token"] = $AgentToken
            }

            $bodyJson = @{
                acao = "processar_arquivo"
                modeloEquipamento = $Equipamento
                nomeArquivo = $nomeArquivo
                conteudoArquivo = $conteudo
            } | ConvertTo-Json -Depth 5

            $res = Invoke-RestMethod -Uri "$ApiUrl/api/agent" -Method Post -Headers $headers -Body $bodyJson -TimeoutSec 15

            if ($res.ok -eq $true -and $res.cargas) {
                foreach ($c in $res.cargas) {
                    $nomeCarga = $c.nomeArquivoSugerido
                    if (!$nomeCarga) { $nomeCarga = "CARGA_" + $c.pedidoId + ".txt" }
                    $destinoCarga = Join-Path $DirCarga $nomeCarga

                    # Grava arquivo de carga no formato do equipamento
                    [System.IO.File]::WriteAllText($destinoCarga, $c.conteudoArquivo, [System.Text.Encoding]::UTF8)

                    # Mostra balao do Windows
                    $NotifyIcon.ShowBalloonTip(
                        3000,
                        "MidwayLab: Pedido Processado!",
                        "Pedido $($c.pedidoId) ($($c.paciente)) entregue ao analisador $Equipamento.",
                        [System.Windows.Forms.ToolTipIcon]::Info
                    )
                }

                # Move para Processados com carimbo de data
                $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
                $destinoProc = Join-Path $DirProcessados "$($arq.BaseName)_$timestamp$($arq.Extension)"
                Move-Item -Path $caminhoArquivo -Destination $destinoProc -Force
            } else {
                throw "API retornou erro: $($res.erro)"
            }

        } catch {
            # Move para pasta de Erros para nao travar a esteira
            $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
            $destinoErro = Join-Path $DirErros "$($arq.BaseName)_ERRO_$timestamp$($arq.Extension)"
            try {
                Move-Item -Path $caminhoArquivo -Destination $destinoErro -Force
            } catch {}

            $NotifyIcon.ShowBalloonTip(
                4000,
                "MidwayLab: Atencao!",
                "Arquivo $nomeArquivo com divergencia. Movido para pasta Erros.",
                [System.Windows.Forms.ToolTipIcon]::Warning
            )
        }
    }
}

# Timer continuo a cada 5 segundos
$Timer = New-Object System.Windows.Forms.Timer
$Timer.Interval = 5000
$Timer.add_Tick({
    Executar-Varredura
})
$Timer.Start()

# Loop da aplicacao da bandeja
[System.Windows.Forms.Application]::Run()
