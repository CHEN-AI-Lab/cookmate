# 翻译完整性检查：以 en.json 为基准，深度递归比对所有语言的 key 是否对齐
# 原实现只比对 zh-CN ↔ en 且仅检查两层，导致 ja/zh-TW 缺 200+ key 未被发现（上线前检查发现）
import json, sys

LOCALES = ["en", "zh-CN", "ja", "zh-TW"]
BASE = "en"

def flat(d, prefix=""):
    out = {}
    for k, v in d.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.update(flat(v, key))
        else:
            out[key] = v
    return out

def load(locale):
    with open(f"shared/messages/{locale}.json", encoding="utf-8") as f:
        return flat(json.load(f))

base = load(BASE)
issues = []

for loc in LOCALES:
    if loc == BASE:
        continue
    cur = load(loc)
    missing = sorted(set(base) - set(cur))
    extra = sorted(set(cur) - set(base))
    if missing:
        issues.append(f"{loc}: 缺失 {len(missing)} 个 key: {missing[:10]}{' ...' if len(missing) > 10 else ''}")
    if extra:
        issues.append(f"{loc}: 多出 {len(extra)} 个 key: {extra[:10]}{' ...' if len(extra) > 10 else ''}")

if issues:
    for i in issues:
        print(i)
    sys.exit(1)
else:
    print(f"✅ All translation keys match across {', '.join(LOCALES)} ({len(base)} keys)")
