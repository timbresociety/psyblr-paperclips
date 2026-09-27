#!/usr/bin/env python3
"""Print the generation prompt for a catalog asset id (or all with --all)."""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(HERE, 'catalog.json')) as f:
    CAT = json.load(f)


def prompt_for(entry):
    material = CAT['materials'][entry['tier']]
    if entry.get('scene'):
        return (
            f"Hyperrealistic isometric game environment art: {entry['object']}. "
            f"Dominant material language: {material}. Accent color {entry['accent']} used sparingly for meaning. "
            "Cinematic soft studio lighting, high detail, no text, no watermark, no people."
        )
    return (
        f"{CAT['promptBase']}. Object: {entry['object']}. "
        f"Material: {material}. Accent: {entry['accentDesc']} ({entry['accent']})."
    )


if __name__ == '__main__':
    if len(sys.argv) == 2 and sys.argv[1] == '--all':
        for e in CAT['assets']:
            print(f"=== {e['id']} -> {e['dest']} ===")
            print(prompt_for(e))
            print()
        sys.exit(0)
    if len(sys.argv) == 2:
        e = next((a for a in CAT['assets'] if a['id'] == sys.argv[1]), None)
        if not e:
            print(f"unknown id {sys.argv[1]}", file=sys.stderr)
            sys.exit(2)
        print(prompt_for(e))
        sys.exit(0)
    print(__doc__, file=sys.stderr)
    sys.exit(2)
