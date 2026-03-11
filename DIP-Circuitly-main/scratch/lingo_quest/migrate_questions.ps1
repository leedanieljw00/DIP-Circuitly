$sourceFile = "questions\EE DIP QUESTION BANK.csv"
$destFile = "questions\QuestionBank.csv"
$jsFile = "js\services\QuestionBankData.js"

# Read raw content to fix weird line endings or potential encoding issues
$content = Get-Content $sourceFile -Raw
$lines = $content -split "`n" | Where-Object { $_.Trim() -ne "" }

# Define the final headers our JS expects
$newHeaders = "id,topicId,question,optionA,optionB,optionC,answer,image,explanation,difficulty"
$newLines = @($newHeaders)
$jsLines = @("window.QuestionBankData = ``$newHeaders")

# State variables
$currentTopicId = 1
$currentDifficulty = 1 
$idCounter = 101

# Mapping string topics to IDs roughly (1: Fundamentals to 8: Three-Phase)
function Get-TopicId {
    param([string]$topicName)
    $t = $topicName.Trim().ToLower()
    if ($t -match "basic laws") { return 1 }
    if ($t -match "energy storage") { return 2 }
    if ($t -match "transient" -or $t -match "steady-state") { return 3 }
    if ($t -match "opamp" -or $t -match "op-amp") { return 4 }
    if ($t -match "laplace") { return 5 }
    if ($t -match "function" -or $t -match "two-port" -or $t -match "network") { return 6 }
    if ($t -match "dc.*ac" -or $t -match "dc") { return 7 }
    if ($t -match "three-phase" -or $t -match "3-phase") { return 8 }
    return 1 # Default
}

function Escape-CsvString {
    param([string]$s)
    if ($s -match ",|`"|`n|`r") {
        $s = $s -replace "`"", "`"`""
        return "`"$s`""
    }
    return $s
}

for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i].Trim()
    
    # Skip header
    if ($line -match "^Stage,QuestionText") { continue }
    
    # Simple CSV parser for the line
    $temp = "h0,h1,h2,h3,h4,h5,h6,h7,h8,h9,h10,h11`n" + $line
    try {
        $row = $temp | ConvertFrom-Csv -ErrorAction Stop
        
        $stage = $row.h0
        $qText = $row.h1
        $optA = $row.h2
        $optB = $row.h3
        $optC = $row.h4
        $optD = $row.h5
        $correctLetter = $row.h6
        $image = $row.h7
        
        # Determine if this is a category header row
        if ($stage -ne "" -and $qText -eq "") {
            $currentTopicId = Get-TopicId $stage
            # Reset ID counter base for new topic (e.g., 201, 301)
            $idCounter = ($currentTopicId * 100) + 1
            continue
        }

        # If it's a valid question row
        if ($qText -ne "") {
            
            # Figure out difficulty based on Question ID if it exists (e.g. W1_BasicLawsEasyQ1)
            if ($stage -match "Easy|simple") { $currentDifficulty = 1 }
            elseif ($stage -match "Average|Intermediate") { $currentDifficulty = 2 }
            elseif ($stage -match "Challenging|Hard") { $currentDifficulty = 3 }
            
            # Map correct answer letter to string value
            $ansStr = ""
            $cl = $correctLetter.Trim().ToLower()
            if ($cl -eq "a") { $ansStr = $optA }
            elseif ($cl -eq "b") { $ansStr = $optB }
            elseif ($cl -eq "c") { $ansStr = $optC }
            elseif ($cl -eq "d") { 
                # Our system expects 3 options usually. If D is correct, swap it with C
                $ansStr = $optD
                $optC = $optD
            } else {
                # Fallback if correct letter is missing or malformed
                $ansStr = $optA 
            }
            
            # Optional: if A, B, C are populated but answer is D, we already shoved D into C. 
            
            # Format row: id,topicId,question,optionA,optionB,optionC,answer,image,explanation,difficulty
            
            $fmtObj = @(
                (Escape-CsvString $idCounter.ToString()),
                (Escape-CsvString $currentTopicId.ToString()),
                (Escape-CsvString $qText),
                (Escape-CsvString $optA),
                (Escape-CsvString $optB),
                (Escape-CsvString $optC),
                (Escape-CsvString $ansStr),
                (Escape-CsvString $image),
                "", # No explanation in source
                (Escape-CsvString $currentDifficulty.ToString())
            ) -join ","
            
            $newLines += $fmtObj
            $jsLines += $fmtObj
            $idCounter++
        }
        
    } catch {
        Write-Warning "Skipped un-parseable line $($i): $line"
    }
}

$jsLines += "``;"

# Write standard CSV
$finalText = $newLines -join "`n"
[IO.File]::WriteAllText($destFile, $finalText, [System.Text.Encoding]::UTF8)

# Write JS formatted file
$finalJsText = $jsLines -join "`n"
[IO.File]::WriteAllText($jsFile, $finalJsText, [System.Text.Encoding]::UTF8)

Write-Host "Migration complete. Wrote $(($newLines.Length) - 1) questions."
