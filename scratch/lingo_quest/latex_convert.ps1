# =====================================================================
# LaTeX Formula Converter for QuestionBank.csv
# Converts electrical engineering notation to MathJax-renderable LaTeX
# =====================================================================

$inputFile  = "C:\Users\rog\OneDrive\Desktop\Circuitly\scratch\lingo_quest\questions\QuestionBank.csv"
$outputFile = "C:\Users\rog\OneDrive\Desktop\Circuitly\scratch\lingo_quest\questions\QuestionBank.csv"
$jsFile     = "C:\Users\rog\OneDrive\Desktop\Circuitly\scratch\lingo_quest\js\services\QuestionBankData.js"

# ---- Function: Convert a single cell value ----
function Convert-Cell($cell) {
    if ([string]::IsNullOrWhiteSpace($cell)) { return $cell }

    # Clean slate: aggressively strip all existing LaTeX/MathJax delimiters from previous runs
    $s = $cell -replace '\$', ''      # Strip all dollar signs
    $s = $s -replace '\\\(', ''       # Strip all \(
    $s = $s -replace '\\\)', ''       # Strip all \)

    # 1. Skip cells that are already URLs or plain special tokens
    if ($s -match '^https?://') { return $cell }  # URL — return original unchanged
    if ($s.Trim() -in @('TRUE','FALSE','Picture','TRUE ','FALSE ')) { return $cell }

    # Decide if any substitution is needed
    $needsLatex = $false

    # Patterns that trigger LaTeX wrapping:
    $triggerPatterns = @(
        '[a-zA-Z]_[a-zA-Z0-9]',     # subscript: i_L, V_c, R_th
        '\^',                         # superscript: e^-t, s^2
        'e\^',                        # exponential: e^-2000t
        '\bOhm\b',                    # unit word
        '\bmicroF\b','\bmicroW\b','\bmicroA\b',  # micro units
        '[ΩωΦθμ]',                   # Greek symbols already in text
        '\b[A-Z][a-z]?_?eq\b',       # Ceq, Leq, Req
        '\b[ivIVRLCZY][0-9]\b',      # i1, V2, R3 etc
        '\bangle\b',                  # phasor angle
        '\b\d+mH\b','\b\d+mF\b','\b\d+[mkMG]?[VAΩWJ]\b'  # units
    )

    foreach ($pat in $triggerPatterns) {
        if ($s -match $pat) { $needsLatex = $true; break }
    }

    if (-not $needsLatex) { return $s }

    # ---- Apply substitutions ----

    # 1. Unicode micro-unit combos FIRST (before bare μ → \mu conversion)
    $s = $s -replace '(\d[\d.]*\s*)μF', '$1\,\mu\text{F}'
    $s = $s -replace '(\d[\d.]*\s*)μH', '$1\,\mu\text{H}'
    $s = $s -replace '(\d[\d.]*\s*)μA', '$1\,\mu\text{A}'
    $s = $s -replace '(\d[\d.]*\s*)μW', '$1\,\mu\text{W}'
    $s = $s -replace '(\d[\d.]*\s*)μs', '$1\,\mu\text{s}'

    # 2. Word "microF/microH/microA/microW" — no word boundary, catches 10microF
    $s = $s -replace '(\d[\d.]*)microF', '$1\,\mu\text{F}'
    $s = $s -replace '(\d[\d.]*)microH', '$1\,\mu\text{H}'
    $s = $s -replace '(\d[\d.]*)microA', '$1\,\mu\text{A}'
    $s = $s -replace '(\d[\d.]*)microW', '$1\,\mu\text{W}'
    $s = $s -replace '\bmicroF\b', '\,\mu\text{F}'
    $s = $s -replace '\bmicroW\b', '\,\mu\text{W}'
    $s = $s -replace '\bmicroA\b', '\,\mu\text{A}'

    # 3. Bare Greek symbols (only after micro-unit combos are handled)
    $s = $s -replace 'Ω', '\Omega '
    $s = $s -replace 'ω', '\omega '
    $s = $s -replace 'μ', '\mu '
    $s = $s -replace 'θ', '\theta '
    $s = $s -replace 'Φ', '\Phi '
    $s = $s -replace 'τ', '\tau '
    $s = $s -replace 'ϕ', '\phi '

    # Units — wrap in \text{}
    $s = $s -replace '\bOhm\b', '\,\Omega'
    $s = $s -replace '(\d)\s*mH\b', '$1\,\text{mH}'
    $s = $s -replace '(\d)\s*mF\b', '$1\,\text{mF}'
    $s = $s -replace '(\d)\s*mA\b', '$1\,\text{mA}'
    $s = $s -replace '(\d)\s*mW\b', '$1\,\text{mW}'
    $s = $s -replace '(\d)\s*mV\b', '$1\,\text{mV}'
    $s = $s -replace '(\d)\s*mJ\b', '$1\,\text{mJ}'
    $s = $s -replace '(\d)\s*kΩ', '$1\,\text{k}\Omega'
    $s = $s -replace '(\d)\s*kW\b', '$1\,\text{kW}'
    $s = $s -replace '(\d)\s*A\b', '$1\,\text{A}'
    $s = $s -replace '(\d)\s*V\b', '$1\,\text{V}'
    $s = $s -replace '(\d)\s*W\b', '$1\,\text{W}'
    $s = $s -replace '(\d)\s*J\b', '$1\,\text{J}'
    $s = $s -replace '(\d)\s*H\b', '$1\,\text{H}'
    $s = $s -replace '(\d)\s*F\b', '$1\,\text{F}'

    # Subscripts: X_y or X_yy → X_{y} (multi-char subscript needs braces)
    $s = $s -replace '([a-zA-Z])_([a-zA-Z]{2,})', '$1_{$2}'
    # Single char subscripts are fine as _x in LaTeX

    # Superscripts: e^-2000t → e^{-2000t}
    $s = $s -replace 'e\^(-?[0-9a-zA-Z/\*\+\-\.]+)', 'e^{$1}'
    # s^2 already works, s^(2+3) needs braces
    $s = $s -replace '([a-zA-Z])\^\(([^)]+)\)', '$1^{$2}'

    # angle notation
    $s = $s -replace '\bangle\b\s*(-?\d+)\s*deg', '\angle $1^\circ'

    # Wrap whole cell in $...$ for MathJax
    # But if the cell is mostly prose (contains spaces between words), 
    # only wrap formula-looking parts — a simple heuristic: 
    # if more than 30% is alpha+space (prose), keep as-is and only wrap sub-expressions.
    $wordCount = ($s -split '\s+').Count
    $hasFormula = $s -match '[_\^\\]'

    if ($hasFormula) {
        # If it looks like a pure formula (short, no long prose)
        if ($wordCount -le 6) {
            $s = '\(' + $s.Trim() + '\)'
        } else {
            # Mixed prose+formula: wrap individual formula snippets in \(...\)
            # subscripted vars: X_y, X_{yz}
            $s = $s -replace '([a-zA-Z])(_\{?[a-zA-Z0-9]+\}?)', '~MS~$1$2~ME~'
            # exponentials: e^{...}
            $s = $s -replace '(e\^\{[^}]+\})', '~MS~$1~ME~'
            # LaTeX unit patterns: number + \,\text{...} or \,\mu\text{...} (with optional space)
            $s = $s -replace '(\d[\d.]*\s*\\,?(?:\\mu\s*)?\\text\{[^}]+\})', '~MS~$1~ME~'
            # LaTeX unit with \Omega: number + \,\Omega or \,\text{k}\Omega
            $s = $s -replace '(\d[\d.]*\\,(?:\\text\{[^}]+\})?\\Omega\s*)', '~MS~$1~ME~'
            # Isolated Greek symbol commands not yet in math mode
            $s = $s -replace '(\\(?:Omega|omega|mu|tau|theta|Phi|phi)\b)', '~MS~$1~ME~'
            # Merge adjacent math zones separated only by whitespace/comma
            $s = $s -replace '~ME~(\s*[,]?\s*)~MS~', '$1'
            $s = $s -replace '~MS~', '\('
            $s = $s -replace '~ME~', '\)'
        }
    }

    return $s
}

# ---- Parse CSV manually to preserve quoted fields ----
function Parse-CSVLine($line) {
    $fields = @()
    $current = ''
    $inQuote = $false
    $i = 0
    while ($i -lt $line.Length) {
        $c = $line[$i]
        if ($c -eq '"' -and $i+1 -lt $line.Length -and $line[$i+1] -eq '"') {
            $current += '"'
            $i++
        } elseif ($c -eq '"') {
            $inQuote = -not $inQuote
        } elseif ($c -eq ',' -and -not $inQuote) {
            $fields += $current
            $current = ''
        } else {
            $current += $c
        }
        $i++
    }
    $fields += $current
    return $fields
}

function Write-CSVLine($fields) {
    $parts = $fields | ForEach-Object {
        $f = $_
        if ($f -match '[,"\r\n]') {
            '"' + $f.Replace('"', '""') + '"'
        } else {
            $f
        }
    }
    return ($parts -join ',')
}

# ---- MAIN ----
$lines = [System.IO.File]::ReadAllLines($inputFile, [System.Text.Encoding]::UTF8)
$outLines = @()

# Header
$outLines += $lines[0]

$convertedCount = 0
$skippedCount = 0

for ($row = 1; $row -lt $lines.Count; $row++) {
    $line = $lines[$row]
    if ([string]::IsNullOrWhiteSpace($line)) {
        $outLines += $line
        continue
    }

    $fields = Parse-CSVLine $line

    if ($fields.Count -lt 8) {
        $outLines += $line
        $skippedCount++
        continue
    }

    # Columns to convert: question(2), optionA(3), optionB(4), optionC(5), optionD(6)
    # Skip: id(0), topicId(1), answer(7), image(8), explanation(9), difficulty(10)
    $convertCols = @(2, 3, 4, 5, 6)
    $changed = $false

    foreach ($col in $convertCols) {
        if ($col -lt $fields.Count) {
            $orig = $fields[$col]
            $conv = Convert-Cell $orig
            if ($conv -ne $orig) {
                $fields[$col] = $conv
                $changed = $true
            }
        }
    }

    if ($changed) { $convertedCount++ }
    $outLines += Write-CSVLine $fields
}

# Write output CSV (UTF-8 no BOM)
[System.IO.File]::WriteAllLines($outputFile, $outLines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done. Converted $convertedCount rows. Skipped $skippedCount rows."

# Regenerate QuestionBankData.js
# IMPORTANT: In a JS template literal, backslashes must be doubled (\\ → \\),
# backticks must be escaped (\`), and ${ must be escaped (\${) to avoid
# template interpolation. This ensures \(...\) MathJax delimiters survive.
$csv = [System.IO.File]::ReadAllText($outputFile, [System.Text.UTF8Encoding]::new($false))
$escaped = $csv.Replace('\', '\\')       # double all backslashes first
$escaped = $escaped.Replace('`', '\`')   # escape backticks
$escaped = $escaped.Replace('${', '\${') # prevent template literal interpolation
$jsText = "window.QuestionBankData = ``" + $escaped + "``;"
[System.IO.File]::WriteAllText($jsFile, $jsText, [System.Text.UTF8Encoding]::new($false))
Write-Host "QuestionBankData.js regenerated."
