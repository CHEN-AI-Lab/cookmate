import json, sys

with open("shared/messages/zh-CN.json") as f: zh = json.load(f)
with open("shared/messages/en.json") as f: en = json.load(f)

zh_keys = {k for k in zh if isinstance(zh[k], dict)}
en_keys = {k for k in en if isinstance(en[k], dict)}
issues = []

missing = zh_keys - en_keys
extra = en_keys - zh_keys
if missing: issues.append("Missing en sections: " + str(missing))
if extra: issues.append("Extra en sections: " + str(extra))

for section in sorted(zh_keys):
    zh_sec = set(zh[section].keys())
    en_sec = set(en[section].keys())
    diff = zh_sec - en_sec
    if diff: issues.append(f"{section}: missing en keys {diff}")
    diff = en_sec - zh_sec
    if diff: issues.append(f"{section}: extra en keys {diff}")

if issues:
    for i in issues: print(i)
    sys.exit(1)
else:
    print("✅ All translation keys match between zh-CN and en")