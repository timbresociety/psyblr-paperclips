#!/usr/bin/env python3
"""
SoloUnicorn asset pipeline — intake.

Verifies, trims, resizes, and installs pulled raw images onto their canonical
registry paths per catalog.json.

Usage:
  python3 scripts/asset_pipeline/intake.py <asset-id> <rawPngPath>   # install one
  python3 scripts/asset_pipeline/intake.py --report                  # installed vs pending
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CATALOG = os.path.join(ROOT, 'scripts', 'asset_pipeline', 'catalog.json')


def load_catalog():
    with open(CATALOG) as f:
        return json.load(f)


def report():
    cat = load_catalog()
    installed, pending = [], []
    for entry in cat['assets']:
        dest = os.path.join(ROOT, entry['dest'].lstrip('/'))
        generated_marker = dest + '.generated'
        if os.path.exists(dest) and os.path.exists(generated_marker):
            installed.append(entry['id'])
        else:
            pending.append(entry['id'])
    print(f"installed ({len(installed)}):")
    for i in installed:
        print(f"  + {i}")
    print(f"pending ({len(pending)}):")
    for p in pending:
        print(f"  - {p}")
    return 0


def intake(asset_id: str, raw_path: str) -> int:
    from PIL import Image

    cat = load_catalog()
    entry = next((a for a in cat['assets'] if a['id'] == asset_id), None)
    if not entry:
        print(f"unknown asset id: {asset_id}", file=sys.stderr)
        return 2

    img = Image.open(raw_path)
    needs_alpha = entry.get('alpha', True)
    if needs_alpha:
        if img.mode != 'RGBA':
            print(f"REJECT {asset_id}: image mode {img.mode}, RGBA with alpha required", file=sys.stderr)
            return 1
        # Verify real transparency exists (not a fully opaque RGBA)
        alpha = img.getchannel('A')
        lo, hi = alpha.getextrema()
        if lo == 255:
            print(f"REJECT {asset_id}: no transparent pixels — regenerate with a transparent background", file=sys.stderr)
            return 1
        # Trim transparent margins with a small uniform pad
        bbox = alpha.getbbox()
        if bbox:
            img = img.crop(bbox)
        pad = max(4, int(0.03 * max(img.size)))
        padded = Image.new('RGBA', (img.width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0))
        padded.paste(img, (pad, pad))
        img = padded
    else:
        img = img.convert('RGB')

    min_dim = entry.get('minSource', 512)
    if max(img.size) < min_dim:
        print(f"REJECT {asset_id}: source {img.size} below minimum {min_dim}", file=sys.stderr)
        return 1

    target = entry['size']  # [w, h] box; aspect preserved inside it
    img.thumbnail((target[0], target[1]), Image.LANCZOS)
    if needs_alpha:
        # Center on an exact target canvas so sprites align consistently
        canvas = Image.new('RGBA', (target[0], target[1]), (0, 0, 0, 0))
        canvas.paste(img, ((target[0] - img.width) // 2, (target[1] - img.height) // 2))
        img = canvas

    dest = os.path.join(ROOT, entry['dest'].lstrip('/'))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    img.save(dest, 'PNG', optimize=True)
    # Marker distinguishes a generated final from a legacy procedural file at the same path.
    with open(dest + '.generated', 'w') as f:
        f.write('generated-final\n')
    print(f"installed {asset_id} -> {os.path.relpath(dest, ROOT)} ({img.width}x{img.height})")
    return 0


if __name__ == '__main__':
    if len(sys.argv) == 2 and sys.argv[1] == '--report':
        sys.exit(report())
    if len(sys.argv) == 3:
        sys.exit(intake(sys.argv[1], sys.argv[2]))
    print(__doc__, file=sys.stderr)
    sys.exit(2)
