# FixMappingValues.ps1
# Restores correct values in mapping.generated.json from RESTORE_VALUES.csv

$ErrorActionPreference = "Stop"

Write-Host "=================================="
Write-Host "Fix Mapping Values"
Write-Host "=================================="

# Paths
$csvPath = Join-Path $PSScriptRoot "..\Config\RESTORE_VALUES.csv"
$jsonPath = Join-Path $PSScriptRoot "mapping.generated.json"

# Read CSV (Key, Value pairs)
Write-Host "Reading restore values from CSV..."
$restoreData = Import-Csv $csvPath
$valueMap = @{}
foreach ($row in $restoreData) {
    $valueMap[$row.Key] = $row.Value
}
Write-Host "Loaded $($valueMap.Count) restore values"

# Read mapping JSON
Write-Host "Reading mapping JSON..."
$mapping = Get-Content $jsonPath -Raw | ConvertFrom-Json

# Update values
Write-Host "Updating values..."
$updated = 0
foreach ($stat in $mapping.stats) {
    if ($stat.key -and $valueMap.ContainsKey($stat.key)) {
        $oldValue = $stat.value
        $newValue = $valueMap[$stat.key]
        
        # Convert to appropriate type (number or string)
        if ($newValue -match '^\d+$') {
            # Pure number
            $stat.value = [int]$newValue
        } elseif ($newValue -match '^-?\d+$') {
            # Negative number
            $stat.value = [int]$newValue
        } else {
            # String
            $stat.value = $newValue
        }
        
        if ($oldValue -ne $newValue) {
            Write-Host "  $($stat.key): '$oldValue' → '$newValue'"
            $updated++
        }
    }
}

Write-Host "`nUpdated $updated values"

# Update timestamp
$mapping.generatedAtUtc = [DateTime]::UtcNow.ToString("o")

# Save JSON
Write-Host "Writing corrected mapping JSON..."
$json = $mapping | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($jsonPath, $json, [System.Text.UTF8Encoding]::new($false))

Write-Host "`nSuccess! mapping.generated.json has been corrected." -ForegroundColor Green
Write-Host "`nNext step: Run JsonToSheet.ps1 to sync to Google Sheets" -ForegroundColor Cyan

Read-Host "`nPress Enter to exit"
