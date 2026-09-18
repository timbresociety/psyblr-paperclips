#!/usr/bin/env python3
"""Refresh hashes after a deliberate master-context edit."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
manifest_path = ROOT / "MANIFEST.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
files = {}
for path in sorted(ROOT.rglob("*")):
    if path.is_symlink():
        raise SystemExit(f"Refusing symlink: {path}")
    if path.is_file() and path != manifest_path:
        files[path.relative_to(ROOT).as_posix()] = hashlib.sha256(path.read_bytes()).hexdigest()
manifest["files"] = files
manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Refreshed {len(files)} file hashes. Run scripts/check_master.py next.")
