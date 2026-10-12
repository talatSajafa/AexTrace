# build.ps1
$empp = "C:\Users\EXOTIC\emsdk\upstream\emscripten\em++.exe"

Write-Host "Building AexTrace WASM..." -ForegroundColor Cyan

if (-not (Test-Path "web/dist")) {
    New-Item -ItemType Directory -Path "web/dist" | Out-Null
}

& $empp `
  engine/bindings.cpp `
  engine/core/interpreter.cpp `
  engine/core/tracer.cpp `
  -O3 -std=c++20 `
  -s WASM=1 -s MODULARIZE=1 -s EXPORT_ES6=1 `
  -s ENVIRONMENT=web `
  -s INITIAL_MEMORY=16777216 `
  -s ALLOW_MEMORY_GROWTH=0 `
  --bind `
  -Iengine `
  -o web/dist/aextrace.js

if (Test-Path "web/dist/aextrace.wasm") {
    $size = (Get-Item "web/dist/aextrace.wasm").Length
    Write-Host "WASM OK - size: $size bytes" -ForegroundColor Green
} else {
    Write-Host "WASM FAILED" -ForegroundColor Red
}

Write-Host "Building TypeScript..." -ForegroundColor Cyan
npx tsc

if ($LASTEXITCODE -eq 0) {
    Write-Host "TypeScript OK" -ForegroundColor Green
} else {
    Write-Host "TypeScript FAILED" -ForegroundColor Red
}