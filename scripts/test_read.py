import json
import re

with open('src/data/mock-tests-bundle.json', 'r', encoding='utf-8') as f:
    bundle = json.load(f)

print(f"Loaded {len(bundle)} tests successfully.")
