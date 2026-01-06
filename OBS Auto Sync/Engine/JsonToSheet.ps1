# JsonToSheet.ps1
# Pushes JSON edits back to the Google Sheet (via Web App)

param(
    [string]$ConfigPath = "..\Config\ribbits.config.json",
    [string]$JsonPath = ".\mapping.generated.json",
    [switch]$UpdateLabels,
    [switch]$UpdateTypes,
    [switch]$UpdateOutputFiles
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

function Read-MappingJson {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        throw "Mapping JSON not found: $Path"
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

function Batch-UpdateSheetCells {
    param($cfg, $stats)
    
    if ($stats.Count -eq 0) {
        Write-Host "No updates to apply"
        return
    }
    
    $url = "$($cfg.auth.webAppUrl)?action=batchUpdate"
    $body = $stats | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json; charset=utf-8"
        
        if ($response.error) {
            throw "Web App Error: $($response.error)"
        }
        
        Write-Host "Updated $($response.cellsUpdated) cells"
        Write-Host "  Matched: $($response.matched) stats"
        Write-Host "  Not found: $($response.notFound) stats"
        
        return $response
        
    } catch {
        Write-Host "ERROR calling web app: $_" -ForegroundColor Red
        throw
    }
}

# ============================================================================
# Main Logic
# ============================================================================

function Sync-JsonToSheet {
    param($cfg, $mapping, [switch]$UpdateLabels, [switch]$UpdateTypes, [switch]$UpdateOutputFiles)
    
    Write-Host "Fetching current sheet data..."
    $sheetRows = Get-SheetValues $cfg
    
    # Build Key -> Row lookup
    $keyToRow = @{}
    foreach ($row in $sheetRows) {
        $key = ($row.D -as [string]).Trim()
        if ($key) {
            $keyToRow[$key] = $row.row
        }
    }
    
    Write-Host "Found $($keyToRow.Count) rows with Keys in sheet"
    
    # Prepare updates
    $updates = @()
    $notFound = 0
    
    foreach ($stat in $mapping.stats) {
        if (-not $stat.key) { continue }
        
        $rowNum = $keyToRow[$stat.key]
        if (-not $rowNum) {
            $notFound++
            Write-Host "  Warning: Key '$($stat.key)' not found in sheet" -ForegroundColor Yellow
            continue
        }
        
        # Build update object as PSCustomObject for proper JSON serialization
        $update = [PSCustomObject]@{
            key = $stat.key
            value = $stat.value
        }
        
        # Optionally add Label
        if ($UpdateLabels) {
            $update | Add-Member -NotePropertyName label -NotePropertyValue $stat.label
        }
        
        # Optionally add Type
        if ($UpdateTypes) {
            $update | Add-Member -NotePropertyName type -NotePropertyValue $stat.type
        }
        
        # Optionally add OutputFile
        if ($UpdateOutputFiles) {
            $update | Add-Member -NotePropertyName outputFile -NotePropertyValue $stat.outputFile
        }
        
        $updates += $update
    }
    
    if ($notFound -gt 0) {
        Write-Host "Warning: $notFound stats not found in sheet" -ForegroundColor Yellow
    }
    
    if ($updates.Count -gt 0) {
        Write-Host "`nApplying $($updates.Count) updates to sheet..."
        Batch-UpdateSheetCells $cfg $updates
        Write-Host "Sync complete!" -ForegroundColor Green
    } else {
        Write-Host "No updates to apply"
    }
}

# ============================================================================
# Entry Point
# ============================================================================

Write-Host "==================================="
Write-Host "JSON to Sheet Sync (Web App)"
Write-Host "==================================="

try {
    $cfg = Read-Config $ConfigPath
    $jsonFullPath = Join-Path $PSScriptRoot $JsonPath

    Write-Host "Config: $ConfigPath"
    Write-Host "JSON: $jsonFullPath"
    Write-Host "Web App URL: $($cfg.auth.webAppUrl)"

    if (-not (Test-Path $jsonFullPath)) {
        Write-Host "ERROR: Mapping JSON not found: $jsonFullPath" -ForegroundColor Red
        Write-Host "Run RibbitsStatAssistant.ps1 -Once first to generate it" -ForegroundColor Yellow
        Write-Host "`n"
        Read-Host "Press Enter to exit"
        exit 1
    }

    $mapping = Read-MappingJson $jsonFullPath
    Write-Host "Loaded $($mapping.stats.Count) stats from JSON"

    Write-Host "`nUpdate mode:"
    Write-Host "  Values (Column B): Always"
    Write-Host "  Labels (Column A): $(if ($UpdateLabels) {'Yes'} else {'No'})"
    Write-Host "  Types (Column C): $(if ($UpdateTypes) {'Yes'} else {'No'})"
    Write-Host "  OutputFiles (Column E): $(if ($UpdateOutputFiles) {'Yes'} else {'No'})"
    Write-Host ""

    Sync-JsonToSheet $cfg $mapping -UpdateLabels:$UpdateLabels -UpdateTypes:$UpdateTypes -UpdateOutputFiles:$UpdateOutputFiles
    
    Write-Host "`n"
    Read-Host "Press Enter to exit"
    
} catch {
    Write-Host "`nERROR: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nStack Trace:" -ForegroundColor Yellow
    Write-Host $_.ScriptStackTrace -ForegroundColor Yellow
    Write-Host "`n"
    Read-Host "Press Enter to exit"
    exit 1
}
