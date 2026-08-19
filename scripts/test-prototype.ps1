[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    $nodePath = $node.Source
}
else {
    $nodePath = 'C:\Users\pc\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
}

if (-not (Test-Path -LiteralPath $nodePath)) {
    throw 'Node.js runtime not found. No dependencies were installed.'
}

$projectRoot = Split-Path -Parent $PSScriptRoot
& $nodePath --test (Join-Path $projectRoot 'tests\prototype\*.test.mjs')
if ($LASTEXITCODE -ne 0) {
    throw "Prototype tests failed with exit code $LASTEXITCODE."
}
