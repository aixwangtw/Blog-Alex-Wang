#!/usr/bin/env python3
"""把本機草稿的 body + faqs 一起推回 Directus，並依需要設定 updated_date。

現有的 tools/push-article-fixes.mjs 只 PATCH body，FAQ 的改動推不上去，故補這支。
用 yaml 正式解析 frontmatter，不用 regex（faqs 是巢狀結構，regex 解不可靠）。

用法：DIRECTUS_TOKEN=xxx python3 push_full.py <草稿md> <文章id> [updated_date] [--dry]
"""
import json, os, re, sys, urllib.request

import yaml

CMS = "https://cms.aixwang.dev"

args = [a for a in sys.argv[1:] if a != "--dry"]
dry = "--dry" in sys.argv
if len(args) < 2:
    sys.exit("用法：DIRECTUS_TOKEN=xxx python3 push_full.py <草稿md> <id> [updated_date] [--dry]")
path, article_id = args[0], args[1]
updated = args[2] if len(args) > 2 else None

raw = open(path, encoding="utf-8").read()
m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.S)
if not m:
    sys.exit("找不到 frontmatter")
fm = yaml.safe_load(m.group(1))
body = m.group(2).lstrip("\n")
faqs = fm.get("faqs") or []

payload = {"body": body, "faqs": faqs}
if updated:
    payload["updated_date"] = updated

print(f"id={article_id}｜body {len(body)} 字元｜faqs {len(faqs)} 題｜updated_date {updated or '(不動)'}")
for i, f in enumerate(faqs, 1):
    print(f"  {i}. {f['question'][:44]}（答 {len(f['answer'])} 字）")
leftover = re.findall(r"不是一般 ?ChatGPT|進錯頁面|不是 ChatGPT 的用量頁", body + json.dumps(faqs, ensure_ascii=False))
print("殘留錯誤說法：", leftover or "無")

if dry:
    print("\n[--dry] 只驗證解析，未送出")
    sys.exit(0)

token = os.environ.get("DIRECTUS_TOKEN")
if not token:
    sys.exit("缺少 DIRECTUS_TOKEN")
req = urllib.request.Request(
    f"{CMS}/items/articles/{article_id}",
    data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
    method="PATCH",
)
try:
    with urllib.request.urlopen(req) as r:
        print(f"HTTP {r.status} 成功")
except urllib.error.HTTPError as e:
    sys.exit(f"HTTP {e.code}：{e.read().decode('utf-8', 'replace')[:300]}")
