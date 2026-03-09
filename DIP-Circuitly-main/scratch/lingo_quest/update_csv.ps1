$csvPath = "questions\QuestionBank.csv"
$jsPath = "js\services\QuestionBankData.js"

function Process-File {
    param(
        [string]$filePath,
        [bool]$isJs
    )

    $content = Get-Content $filePath -Raw
    $lines = $content -split "`n"
    
    $newLines = @()
    
    if ($isJs) {
        $newLines += "window.QuestionBankData = ``id,topicId,question,optionA,optionB,optionC,answer,image,explanation,difficulty"
    } else {
        $newLines += "id,topicId,question,optionA,optionB,optionC,answer,image,explanation,difficulty"
    }

    $startIdx = 1

    # In PS, ConvertFrom-Csv is handy but handling raw lines with split is safer due to the backtick string in JS
    $topicMap = @{}

    # First Pass
    for ($i = $startIdx; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        if ([string]::IsNullOrWhiteSpace($line) -or $line.Trim() -eq "```;") { continue }

        # Simple CSV parse
        try {
            # Temp string to parse
            $temp = "h0,h1,h2,h3,h4,h5,h6,h7,h8,h9`n" + $line
            $parsed = $temp | ConvertFrom-Csv -ErrorAction Stop
            
            $tid = [int]$parsed.h1
            if (-not $topicMap.ContainsKey($tid)) {
                $topicMap[$tid] = @()
            }
            # Store original index and parsed object
            $topicMap[$tid] += @{ Index = $i; Data = $parsed }
        } catch {
            Write-Warning "Skipped parsing line $i due to format"
        }
    }

    $difficulties = @{}

    foreach ($key in $topicMap.Keys) {
        $items = $topicMap[$key]
        $n = $items.Count
        $chunk = [math]::Floor($n / 3)
        
        for ($idx = 0; $idx -lt $n; $idx++) {
            $diff = 1
            if ($n -ge 3) {
                if ($idx -lt $chunk) { $diff = 1 }
                elseif ($idx -lt 2 * $chunk) { $diff = 2 }
                else { $diff = 3 }
            }
            $difficulties[$items[$idx].Index] = $diff
        }
    }

    # Second pass
    for ($i = $startIdx; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        if ([string]::IsNullOrWhiteSpace($line)) {
            $newLines += $line
            continue
        }
        if ($line.Trim() -eq "```;") {
             $newLines += $line
             continue
        }

        try {
            $temp = "h0,h1,h2,h3,h4,h5,h6,h7,h8,h9`n" + $line
            $row = $temp | ConvertFrom-Csv -ErrorAction Stop
            
            $id = $row.h0
            $tId = $row.h1
            $q = $row.h2
            $oa = $row.h3
            $ob = $row.h4
            $oc = $row.h5
            $ans = $row.h6
            # Assuming h7 was explanation originally, moving to h8
            $img = ""
            $exp = ""
            if ($row.h7) { $exp = $row.h7 }
            
            $diff = 1
            if ($difficulties.ContainsKey($i)) {
                $diff = $difficulties[$i]
            }

            # Quote strings that contain commas or quotes
            function escape([string]$s) {
                if ($s -match ",|`"") {
                    $s = $s -replace "`"", "`"`""
                    return "`"$s`""
                }
                return $s
            }

            $fmt = @(
                (escape $id),
                (escape $tId),
                (escape $q),
                (escape $oa),
                (escape $ob),
                (escape $oc),
                (escape $ans),
                (escape $img),
                (escape $exp),
                (escape $diff.ToString())
            ) -join ","

            $newLines += $fmt

        } catch {
            $newLines += $line # Fallback to original
        }
    }

    $finalText = $newLines -join "`n"
    [IO.File]::WriteAllText($filePath, $finalText, [System.Text.Encoding]::UTF8)
}

Write-Host "Processing PS files..."
Process-File $csvPath $false
Process-File $jsPath $true
Write-Host "Done!"
