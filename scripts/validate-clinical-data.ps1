[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$jsonFiles = Get-ChildItem -Path (Join-Path $projectRoot 'clinical-data'), (Join-Path $projectRoot 'test-cases') -Recurse -File -Filter '*.json'
$errors = [System.Collections.Generic.List[string]]::new()

function Add-ValidationError([string]$message) {
    $script:errors.Add($message)
}

$documents = @{}
foreach ($file in $jsonFiles) {
    try {
        $raw = Get-Content -Raw -Encoding UTF8 -LiteralPath $file.FullName
        $documents[$file.FullName] = $raw | ConvertFrom-Json
    }
    catch {
        Add-ValidationError "Invalid JSON: $($file.FullName): $($_.Exception.Message)"
    }
}

$schemaFiles = $jsonFiles | Where-Object { $_.FullName -like '*clinical-data\schemas\*.schema.json' }
foreach ($schemaFile in $schemaFiles) {
    $schema = $documents[$schemaFile.FullName]
    if (-not $schema.'$schema' -or -not $schema.'$id' -or -not $schema.title -or $schema.type -ne 'object') {
        Add-ValidationError "Schema metadata incomplete: $($schemaFile.FullName)"
    }
}

$testFiles = $jsonFiles | Where-Object { $_.FullName -like '*test-cases\anonymized\TC-*.json' }
$testIds = [System.Collections.Generic.HashSet[string]]::new()
foreach ($testFile in $testFiles) {
    $test = $documents[$testFile.FullName]
    if ($test.synthetic -ne $true) { Add-ValidationError "Test case must be synthetic: $($testFile.Name)" }
    if (-not $test.testCaseId -or -not $test.testCaseId.StartsWith('TC-')) { Add-ValidationError "Invalid testCaseId: $($testFile.Name)" }
    elseif (-not $testIds.Add([string]$test.testCaseId)) { Add-ValidationError "Duplicate testCaseId: $($test.testCaseId)" }
    if ($test.input.synthetic -ne $true) { Add-ValidationError "Nested assessment must be synthetic: $($testFile.Name)" }
    if ($test.input.functionalEvidence.therapistConfirmationRequired -ne $true) { Add-ValidationError "Therapist confirmation must be required: $($testFile.Name)" }
    if ($test.input.safetyScreen.outcome -ne $test.expected.safetyOutcome) { Add-ValidationError "Safety outcome mismatch: $($testFile.Name)" }
    if ($test.expected.safetyOutcome -ne 'eligible_for_matching' -and $test.expected.allowedPrescriptionIds.Count -gt 0) { Add-ValidationError "Blocked/incomplete case cannot allow prescriptions: $($testFile.Name)" }
    if ($test.clinicalReview.status -ne 'pending_clinical_review') { Add-ValidationError "Unapproved fixture must remain pending clinical review: $($testFile.Name)" }
}

$ruleFiles = $jsonFiles | Where-Object { $_.FullName -like '*clinical-data\decision-rules\*.json' }
foreach ($ruleFile in $ruleFiles) {
    $rule = $documents[$ruleFile.FullName]
    $positiveCoverage = $false
    $negativeCoverage = $false
    foreach ($testId in $rule.tests) {
        if (-not $testIds.Contains([string]$testId)) { Add-ValidationError "Rule $($rule.ruleId) references missing test $testId" }
        else {
            $referencedTest = $testFiles | Where-Object { $documents[$_.FullName].testCaseId -eq $testId } | Select-Object -First 1
            $rationaleCodes = @($documents[$referencedTest.FullName].expected.rationaleCodes)
            if ($rationaleCodes -contains $rule.rationaleCode) { $positiveCoverage = $true } else { $negativeCoverage = $true }
        }
    }
    if (-not $positiveCoverage) { Add-ValidationError "Rule lacks positive test coverage: $($rule.ruleId)" }
    if (-not $negativeCoverage) { Add-ValidationError "Rule lacks negative test coverage: $($rule.ruleId)" }
    if ($rule.status -eq 'approved' -and $rule.clinicalReview.status -ne 'approved') { Add-ValidationError "Approved rule lacks clinical approval: $($rule.ruleId)" }
}

$prescriptionFiles = $jsonFiles | Where-Object { $_.FullName -like '*clinical-data\prescriptions\*.json' }
foreach ($prescriptionFile in $prescriptionFiles) {
    $prescription = $documents[$prescriptionFile.FullName]
    if ($prescription.status -eq 'approved' -and $prescription.clinicalReview.status -ne 'approved') {
        Add-ValidationError "Approved prescription lacks clinical approval: $($prescription.prescriptionId)"
    }
    if ($prescription.clinicalReview.status -eq 'pending_clinical_review' -and 'AX' -notin $prescription.assistanceLevels) {
        Add-ValidationError "Unapproved prescription must include AX: $($prescription.prescriptionId)"
    }
}

$functionalFrameworkPath = Join-Path $projectRoot 'clinical-data\assessments\functional-level-framework.draft.json'
if (-not $documents.ContainsKey($functionalFrameworkPath)) {
    Add-ValidationError 'Missing F0-F5 functional framework.'
}
else {
    $framework = $documents[$functionalFrameworkPath]
    $levelCodes = @($framework.levels | ForEach-Object { $_.code })
    foreach ($requiredLevel in @('F0', 'F1', 'F2', 'F3', 'F4', 'F5')) {
        if ($requiredLevel -notin $levelCodes) { Add-ValidationError "Functional framework missing level: $requiredLevel" }
    }
    if ($framework.conflictPolicy.algorithmMayForceLevel -ne $false) { Add-ValidationError 'Algorithm must not force a level when evidence conflicts.' }
    if ($framework.conflictPolicy.therapistConfirmationRequired -ne $true) { Add-ValidationError 'Functional level must require therapist confirmation.' }
}

$systemTestFiles = $jsonFiles | Where-Object { $_.FullName -like '*test-cases\system\SEC-*.json' }
$systemTestIds = [System.Collections.Generic.HashSet[string]]::new()
foreach ($systemTestFile in $systemTestFiles) {
    $systemTest = $documents[$systemTestFile.FullName]
    if ($systemTest.synthetic -ne $true) { Add-ValidationError "System test must be synthetic: $($systemTestFile.Name)" }
    if (-not $systemTest.systemTestId -or -not $systemTest.systemTestId.StartsWith('SEC-')) { Add-ValidationError "Invalid systemTestId: $($systemTestFile.Name)" }
    elseif (-not $systemTestIds.Add([string]$systemTest.systemTestId)) { Add-ValidationError "Duplicate systemTestId: $($systemTest.systemTestId)" }
    if ($systemTest.area -eq 'export' -and $systemTest.expected.result -ne 'denied') { Add-ValidationError "Current negative export fixture must fail closed: $($systemTestFile.Name)" }
    if ($systemTest.expected.PSObject.Properties.Name -contains 'patientPayloadWrittenToLog' -and $systemTest.expected.patientPayloadWrittenToLog -ne $false) {
        Add-ValidationError "Patient payload must never be written to log: $($systemTestFile.Name)"
    }
}

$authConfigPath = Join-Path $projectRoot 'clinical-data\auth-config.example.json'
if (-not $documents.ContainsKey($authConfigPath)) {
    Add-ValidationError 'Missing authentication configuration example.'
}
else {
    $authConfig = $documents[$authConfigPath]
    if ($authConfig.transportPolicy.publicInternetExposureAllowed -ne $false) { Add-ValidationError 'Public Internet exposure must be disabled.' }
    if ($authConfig.transportPolicy.httpsRequired -ne $true) { Add-ValidationError 'HTTPS must be required.' }
    if ($authConfig.sessionPolicy.clearPatientSessionOnLogout -ne $true) { Add-ValidationError 'Logout must clear the patient session.' }
    if ($authConfig.passwordPolicy.minimumLength -lt 12) { Add-ValidationError 'Password minimum length must be at least 12.' }
}
$allText = ($jsonFiles | ForEach-Object { Get-Content -Raw -Encoding UTF8 -LiteralPath $_.FullName }) -join "`n"
$piiPatterns = @(
    @{ Name = 'Chinese mobile number'; Pattern = '(?<!\d)1[3-9]\d{9}(?!\d)' },
    @{ Name = 'Email address'; Pattern = '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' },
    @{ Name = 'PRC ID-like number'; Pattern = '(?<!\d)\d{17}[0-9Xx](?!\d)' }
)
foreach ($piiPattern in $piiPatterns) {
    if ($allText -match $piiPattern.Pattern) { Add-ValidationError "Potential PII detected: $($piiPattern.Name)" }
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    throw "Clinical data validation failed with $($errors.Count) error(s)."
}

Write-Output "Validated $($jsonFiles.Count) JSON files, $($schemaFiles.Count) schemas, $($testFiles.Count) clinical cases, $($systemTestFiles.Count) system security cases, $($ruleFiles.Count) rules, and $($prescriptionFiles.Count) prescription templates."
Write-Output 'Clinical data validation passed.'
