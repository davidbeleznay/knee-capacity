#!/bin/bash
# KneeCapacity Build Script

echo "🔨 Building KneeCapacity..."

# Concatenate modules in correct order
cat \
  src/core/state.js \
  src/utils/helpers.js \
  src/core/router.js \
  src/ui/checkin.js \
  src/ui/stopwatch.js \
  src/ui/workouts.js \
  src/ui/analytics.js \
  src/ui/measurements.js \
  src/core/init.js \
  > app.bundle.js

echo "✅ Built app.bundle.js ($(wc -l < app.bundle.js) lines)"
