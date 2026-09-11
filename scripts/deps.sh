#!/usr/bin/env bash
set -euo pipefail

for dir in packages/*; do
    if [ -f "$dir/package.json" ]; then
        echo "==> $dir"
        (cd "$dir" && pnpm dlx npm-check-updates -u)
    fi
done
