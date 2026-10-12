#!/bin/bash
set -e

emcc engine/bindings.cpp \
  -O3 -std=c++20 \
  -s WASM=1 -s MODULARIZE=1 -s EXPORT_ES6=1 \
  -s ENVIRONMENT=web \
  -s INITIAL_MEMORY=16777216 \
  -s ALLOW_MEMORY_GROWTH=0 \
  --bind \
  -o dist/aextrace.js

echo "✅ Build done: dist/aextrace.js + dist/aextrace.wasm"