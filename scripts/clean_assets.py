#!/usr/bin/env python3
import os
import shutil
from PIL import Image, ImageFilter
from collections import deque

def clean_asset_file(png_path, jpg_path=None, bg_thresh=60, margin=16):
    im_png = Image.open(png_path).convert('RGBA')
    w, h = im_png.size
    pix_png = im_png.load()
    
    im_jpg = None
    if jpg_path and os.path.exists(jpg_path):
        im_jpg = Image.open(jpg_path).convert('RGB')
        pix_jpg = im_jpg.load()

    # 1. Clear outer boundary
    for y in range(h):
        for x in range(w):
            if x < margin or x >= w - margin or y < margin or y >= h - margin:
                r, g, b, _ = pix_png[x, y]
                pix_png[x, y] = (r, g, b, 0)

    # 2. Flood-fill from outer perimeter to clear all connected background
    visited = [[False for _ in range(w)] for _ in range(h)]
    q = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
        visited[0][x] = True
        visited[h - 1][x] = True
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))
        visited[y][0] = True
        visited[y][w - 1] = True
        
    while q:
        cx, cy = q.popleft()
        r, g, b, _ = pix_png[cx, cy]
        pix_png[cx, cy] = (r, g, b, 0)
        
        for nx, ny in [(cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)]:
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                nr, ng, nb, na = pix_png[nx, ny]
                is_bg = (na == 0)
                if not is_bg:
                    val = max(pix_jpg[nx, ny]) if im_jpg else max(nr, ng, nb)
                    if val < bg_thresh:
                        is_bg = True
                if is_bg:
                    visited[ny][nx] = True
                    q.append((nx, ny))

    # 3. Identify connected components to drop disconnected background patches/islands
    alpha = im_png.split()[-1]
    mask = alpha.point(lambda p: 255 if p > 20 else 0)
    dilated = mask.filter(ImageFilter.MaxFilter(9))
    
    scale = 4
    dw, dh = w // scale, h // scale
    grid = [[False for _ in range(dw)] for _ in range(dh)]
    dpix = dilated.load()
    for y in range(dh):
        for x in range(dw):
            if dpix[x * scale, y * scale] > 100:
                grid[y][x] = True
                
    comp_visited = [[False for _ in range(dw)] for _ in range(dh)]
    comps = []
    for y in range(dh):
        for x in range(dw):
            if grid[y][x] and not comp_visited[y][x]:
                cq = deque([(x, y)])
                comp_visited[y][x] = True
                c = []
                while cq:
                    kx, ky = cq.popleft()
                    c.append((kx, ky))
                    for mx, my in [(kx + 1, ky), (kx - 1, ky), (kx, ky + 1), (kx, ky - 1)]:
                        if 0 <= mx < dw and 0 <= my < dh and grid[my][mx] and not comp_visited[my][mx]:
                            comp_visited[my][mx] = True
                            cq.append((mx, my))
                comps.append(c)
                
    comps.sort(key=len, reverse=True)
    if comps:
        main_size = len(comps[0])
        valid_blocks = set()
        for c in comps:
            # Must be substantial component (at least 5% of main object or > 300 blocks)
            if len(c) >= max(300, int(main_size * 0.05)):
                avg_x = sum(bx for bx, by in c) / len(c)
                avg_y = sum(by for bx, by in c) / len(c)
                # Ensure it's not a border smudge
                if 10 < avg_x < dw - 10 and 10 < avg_y < dh - 10:
                    for b in c:
                        valid_blocks.add(b)
                        
        for y in range(h):
            for x in range(w):
                if (x // scale, y // scale) not in valid_blocks:
                    r, g, b, _ = pix_png[x, y]
                    pix_png[x, y] = (r, g, b, 0)

    # 4. Soft anti-aliased edge smoothing
    cur_alpha = im_png.split()[-1]
    blurred_alpha = cur_alpha.filter(ImageFilter.GaussianBlur(0.75))
    final_alpha = Image.composite(cur_alpha, blurred_alpha, cur_alpha.point(lambda p: 255 if p > 210 else 0))
    im_png.putalpha(final_alpha)
    
    # Save back
    im_png.save(png_path)
    print(f"Cleaned {os.path.basename(png_path)} -> bbox: {im_png.getbbox()}")

def main():
    target_dir = os.path.join(os.getcwd(), 'public/assets/2.5d')
    dist_dir = os.path.join(os.getcwd(), 'dist/assets/2.5d')
    
    clean_targets = [
        ('expansion_intelligence.png', 55, 16),
        ('expansion_infrastructure.png', 55, 16),
        ('expansion_security.png', 55, 16),
        ('nav_demand.png', 55, 16),
        ('nav_product.png', 65, 16),
        ('nav_monetise.png', 55, 16),
        ('nav_retention.png', 55, 16),
        ('nav_operations.png', 55, 16),
        ('nav_finance.png', 55, 16),
        ('tool_coffee_surge.png', 50, 12),
        ('piggy_bank_cracked.png', 30, 2),
        ('piggy_bank_intact.png', 30, 2),
    ]

    for fname, thresh, margin in clean_targets:
        png_p = os.path.join(target_dir, fname)
        jpg_p = os.path.join(target_dir, fname.replace('.png', '.jpg'))
        if os.path.exists(png_p):
            clean_asset_file(png_p, jpg_p, bg_thresh=thresh, margin=margin)
            if os.path.exists(dist_dir):
                shutil.copy2(png_p, os.path.join(dist_dir, fname))

if __name__ == '__main__':
    main()
