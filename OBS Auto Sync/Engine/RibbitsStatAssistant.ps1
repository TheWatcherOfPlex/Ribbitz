# RibbitsStatAssistant.ps1
# Watches a Google Sheet (via Web App) and generates .txt files for OBS

param(
    [string]$ConfigPath = "..\Config\ribbits.config.json",
    [switch]$Once
)

$ErrorActionPreference = "Stop"

# ============================================================================
# Configuration
# ============================================================================

function Read-Config {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        throw "Config file not found: $Path"
    }
    
    $json = Get-Content $Path -Raw | ConvertFrom-Json
    return $json
}

# ============================================================================
# Google Sheets Web App API
# ============================================================================

function Get-SheetValues {
    param($cfg)
    
    $url = "$($cfg.auth.webAppUrl)?action=getValues"
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -ContentType "application/json"
        
        if ($response.error) {
            throw "Web App Error: $($response.error)"
        }
        
        return $response.rows
        
    } catch {
        Write-Host "ERROR calling web app: $_" -ForegroundColor Red
        throw
    }
}

# ============================================================================
# Mapping Generation
# ============================================================================

function Convert-ToSlug {
    param([string]$text)
    
    $slug = $text.ToLower() -replace '[^a-z0-9]+','-' -replace '^-|-$',''
    return $slug
}

function Build-Mapping {
    param($rows, $cfg)
    
    $headers = @()
    $stats = @()
    
    $headerRegex = '^==\s*(.+?)\s*==$'
    
    foreach ($row in $rows) {
        $label = ($row.A -as [string]).Trim()
        if (-not $label) { continue }
        
        # Check if header
        if ($label -match $headerRegex) {
            $headerTitle = $matches[1]
            $headers += [PSCustomObject]@{
                row = $row.row
                title = $headerTitle
                label = $label
            }
            continue
        }
        
        # Regular stat
        $type = ($row.C -as [string]).Trim()
        if (-not $type) { $type = "custom" }
        
        $key = ($row.D -as [string]).Trim()
        if (-not $key) { $key = Convert-ToSlug $label }
        
        $outputFile = ($row.E -as [string]).Trim()
        if (-not $outputFile) { $outputFile = "$key.txt" }
        
        $stats += [PSCustomObject]@{
            row = $row.row
            label = $label
            value = $row.B
            type = $type
            key = $key
            outputFile = $outputFile
            cellA = "A$($row.row)"
            cellB = "B$($row.row)"
        }
    }
    
    $mapping = [ordered]@{
        schemaVersion = "1.0"
        generatedAtUtc = [DateTime]::UtcNow.ToString("o")
        typeOrder = $cfg.typeOrder
        headers = $headers
        stats = $stats
    }
    
    return $mapping
}

# ============================================================================
# File Output
# ============================================================================

function Write-StatFiles {
    param($mapping, $cfg)
    
    $outputFolder = $cfg.output.folder
    $encoding = if ($cfg.output.encoding -eq "utf8NoBom") { [System.Text.UTF8Encoding]::new($false) } else { "UTF8" }
    
    # Ensure base folder exists
    if (-not (Test-Path $outputFolder)) {
        New-Item -ItemType Directory -Path $outputFolder -Force | Out-Null
    }
    
    foreach ($stat in $mapping.stats) {
        $typeFolder = Join-Path $outputFolder $stat.type
        if (-not (Test-Path $typeFolder)) {
            New-Item -ItemType Directory -Path $typeFolder -Force | Out-Null
        }
        
        $filePath = Join-Path $typeFolder $stat.outputFile
        $value = $stat.value
        
        [System.IO.File]::WriteAllText($filePath, $value, $encoding)
    }
    
    Write-Host "Wrote $($mapping.stats.Count) stat files"
}

function Write-MappingJson {
    param($mapping, $cfg)
    
    $mappingPath = Join-Path $PSScriptRoot $cfg.generatedMappingPath
    $json = $mapping | ConvertTo-Json -Depth 10
    
    [System.IO.File]::WriteAllText($mappingPath, $json, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Wrote mapping to: $mappingPath"
}

# ============================================================================
# Change Detection
# ============================================================================

function Get-DataHash {
    param($rows)
    
    $rowsJson = $rows | ConvertTo-Json -Compress
    $bytes = [Text.Encoding]::UTF8.GetBytes($rowsJson)
    $hash = [Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
    return [BitConverter]::ToString($hash) -replace '-'
}

# ============================================================================
# Main Loop
# ============================================================================

function Run-Loop {
    param($cfg, [switch]$Once)
    
    $lastHash = $null
    
    while ($true) {
        try {
            Write-Host "`n[$([DateTime]::Now.ToString('HH:mm:ss'))] Checking sheet..."
            
            $rows = Get-SheetValues $cfg
            $hash = Get-DataHash $rows
            
            if ($hash -ne $lastHash) {
                Write-Host "Change detected! Regenerating outputs..."
                
                $mapping = Build-Mapping $rows $cfg
                Write-StatFiles $mapping $cfg
                Write-MappingJson $mapping $cfg
                
                $lastHash = $hash
                Write-Host "Done!"
            } else {
                Write-Host "No changes"
            }
            
            if ($Once) {
                break
            }
            
            Start-Sleep -Seconds $cfg.pollSeconds
            
        } catch {
            Write-Host "ERROR: $_" -ForegroundColor Red
            Write-Host $_.ScriptStackTrace -ForegroundColor Red
            if ($Once) {
                throw
            }
            Start-Sleep -Seconds 5
        }
    }
}

# ============================================================================
# Entry Point
# ============================================================================

Write-Host "==================================="
Write-Host "Ribbits Stat Assistant (Web App)"
Write-Host "==================================="

$cfg = Read-Config $ConfigPath
Write-Host "Loaded config from: $ConfigPath"
Write-Host "Web App URL: $($cfg.auth.webAppUrl)"
Write-Host "Output folder: $($cfg.output.folder)"
Write-Host "Poll interval: $($cfg.pollSeconds) seconds"
if ($Once) {
    Write-Host "Mode: Single run"
} else {
    Write-Host "Mode: Continuous polling"
}

Run-Loop $cfg -Once:$Once
