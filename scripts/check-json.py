#!/usr/bin/env python3
"""Validate all JSON files in the project (excluding node_modules, .next, dist)."""
import json
import os
import sys

errors = 0
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', 'dist')]
    for f in files:
        if f.endswith('.json'):
            path = os.path.join(root, f)
            try:
                content = open(path, 'r', encoding='utf-8').read()
                json.loads(content)
            except Exception as e:
                print(f'❌ {path}: {e}')
                errors += 1

if errors == 0:
    print('✅ All JSON files valid')
else:
    print(f'❌ {errors} JSON files have errors')
    sys.exit(1)