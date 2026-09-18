#!/usr/bin/env python3
"""
SoloUnicorn 2.5D Asset Production Generator
Generates all 120 Skill Tree Upgrade icons (6 functions x 4 axes x 5 tiers)
and populates all 35 Milestone Upgrade unique 2.5D assets adhering to the
strict material tier progression and brand guidelines in docs/.
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter

SKILLS_DIR = os.path.join(os.getcwd(), 'public/assets/skills')
MILESTONES_DIR = os.path.join(os.getcwd(), 'public/assets/milestones')
os.makedirs(SKILLS_DIR, exist_ok=True)
os.makedirs(MILESTONES_DIR, exist_ok=True)

FUNCTIONS = {
    'demand': {'color': (255, 92, 154, 255), 'code': 'DEM', 'name': 'Demand'},
    'product': {'color': (88, 217, 255, 255), 'code': 'PRD', 'name': 'Product'},
    'monetisation': {'color': (255, 200, 87, 255), 'code': 'MON', 'name': 'Monetisation'},
    'retention': {'color': (111, 140, 255, 255), 'code': 'RET', 'name': 'Retention'},
    'expansion': {'color': (167, 120, 255, 255), 'code': 'EXP', 'name': 'Expansion'},
    'operations': {'color': (181, 243, 90, 255), 'code': 'OPS', 'name': 'Operations'},
}

AXES = ['craft', 'scale', 'automate', 'luck']

TIER_CONFIGS = {
    1: {
        'name': 'Charcoal / Dark Basalt',
        'top': (30, 36, 44, 255),
        'left': (18, 22, 28, 255),
        'right': (12, 15, 20, 255),
        'rim': (80, 95, 110, 255),
        'specular': (120, 140, 160, 255),
        'glow_intensity': 0.6,
    },
    2: {
        'name': 'Gunmetal / Titanium',
        'top': (100, 116, 139, 255),
        'left': (71, 85, 105, 255),
        'right': (51, 65, 85, 255),
        'rim': (203, 213, 225, 255),
        'specular': (241, 245, 249, 255),
        'glow_intensity': 0.8,
    },
    3: {
        'name': 'Polished Gold / Radiant Brass',
        'top': (251, 191, 36, 255),
        'left': (217, 119, 6, 255),
        'right': (180, 83, 9, 255),
        'rim': (254, 240, 138, 255),
        'specular': (255, 251, 235, 255),
        'glow_intensity': 1.0,
    },
    4: {
        'name': 'Liquid Glass / Optical Crystal',
        'top': (186, 230, 253, 240),
        'left': (56, 189, 248, 225),
        'right': (2, 132, 199, 225),
        'rim': (255, 255, 255, 255),
        'specular': (255, 255, 255, 255),
        'glow_intensity': 1.2,
    },
    5: {
        'name': 'Ethereal / Iridescent Liquid Metal',
        'top': (233, 213, 255, 245),
        'left': (168, 85, 247, 240),
        'right': (192, 38, 211, 240),
        'rim': (255, 255, 255, 255),
        'specular': (255, 255, 255, 255),
        'glow_intensity': 1.5,
    },
}

def render_25d_skill_icon(fn_id, axis, tier):
    """
    Renders a high-craft 2.5D isometric skill tree node icon with 2x supersampling.
    """
    S = 512 # Internal render canvas size
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    cx, cy = S // 2, S // 2 + 15
    
    fn = FUNCTIONS[fn_id]
    tc = TIER_CONFIGS[tier]
    fn_color = fn['color']
    
    # 1. Soft Ambient Occlusion / Contact Shadow
    shadow_w, shadow_h = 170, 75
    s_im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(s_im)
    s_draw.ellipse([cx - shadow_w, cy + 50 - shadow_h, cx + shadow_w, cy + 50 + shadow_h], fill=(0, 0, 0, 140))
    s_im = s_im.filter(ImageFilter.GaussianBlur(24))
    im = Image.alpha_composite(im, s_im)
    draw = ImageDraw.Draw(im)

    # 2. Isometric Pedestal Base (Hexagonal / Beveled Plinth)
    base_w, base_h = 150, 75
    depth = 36
    
    top_pts = [
        (cx, cy - base_h),
        (cx + base_w, cy),
        (cx, cy + base_h),
        (cx - base_w, cy)
    ]
    
    # Left facet
    draw.polygon([
        (cx - base_w, cy),
        (cx, cy + base_h),
        (cx, cy + base_h + depth),
        (cx - base_w, cy + depth)
    ], fill=tc['left'])
    
    # Right facet
    draw.polygon([
        (cx, cy + base_h),
        (cx + base_w, cy),
        (cx + base_w, cy + depth),
        (cx, cy + base_h + depth)
    ], fill=tc['right'])
    
    # Plinth Top Face
    draw.polygon(top_pts, fill=tc['top'])
    
    # Plinth Specular Chamfer Outline
    draw.line(top_pts + [top_pts[0]], fill=tc['rim'], width=3)
    draw.line([(cx, cy + base_h), (cx, cy + base_h + depth)], fill=tc['rim'], width=2)
    
    # Neon Circuit Groove on Plinth
    circuit_margin = 25
    c_pts = [
        (cx, cy - base_h + circuit_margin),
        (cx + base_w - circuit_margin * 1.5, cy),
        (cx, cy + base_h - circuit_margin),
        (cx - base_w + circuit_margin * 1.5, cy)
    ]
    draw.line(c_pts + [c_pts[0]], fill=fn_color, width=3)

    # 3. Department Core Silhouette + Axis Mechanical Feature
    oy = cy - 45 - (tier * 7) # Float elevation based on tier
    r = 55 + (tier * 5)
    
    # Floating 2.5D Isometric Diamond / Cube Structure
    cube_top = [
        (cx, oy - r//2),
        (cx + r, oy),
        (cx, oy + r//2),
        (cx - r, oy)
    ]
    cube_left = [
        (cx - r, oy),
        (cx, oy + r//2),
        (cx, oy + r//2 + r),
        (cx - r, oy + r)
    ]
    cube_right = [
        (cx, oy + r//2),
        (cx + r, oy),
        (cx + r, oy + r),
        (cx, oy + r//2 + r)
    ]
    
    draw.polygon(cube_left, fill=tc['left'])
    draw.polygon(cube_right, fill=tc['right'])
    draw.polygon(cube_top, fill=tc['top'])
    
    # Specular Edge Bevels
    draw.line(cube_top + [cube_top[0]], fill=tc['specular'], width=3)
    draw.line(cube_left + [cube_left[0]], fill=tc['rim'], width=2)
    draw.line(cube_right + [cube_right[0]], fill=tc['rim'], width=2)
    draw.line([(cx, oy + r//2), (cx, oy + r//2 + r)], fill=tc['specular'], width=3)

    # 4. Axis Feature Ornamentation
    if axis == 'craft':
        # Precision laser crosshair & micro-caliper reticle
        draw.ellipse([cx - 24, oy - 12, cx + 24, oy + 12], outline=fn_color, width=3)
        draw.line([(cx - 38, oy), (cx + 38, oy)], fill=fn_color, width=2)
        draw.line([(cx, oy - 20), (cx, oy + 20)], fill=fn_color, width=2)
        draw.ellipse([cx - 8, oy - 4, cx + 8, oy + 4], fill=tc['specular'])
    elif axis == 'scale':
        # Multi-slot bus channels / parallel expansion rails
        for offset in [-24, 0, 24]:
            rx = cx + offset
            ry = oy - (offset // 3)
            draw.polygon([
                (rx - 8, ry - 14), (rx + 8, ry - 6),
                (rx + 8, ry + 16), (rx - 8, ry + 8)
            ], fill=fn_color)
            draw.polygon([
                (rx - 8, ry - 14), (rx + 8, ry - 6),
                (rx + 8, ry - 4), (rx - 8, ry - 12)
            ], fill=tc['specular'])
    elif axis == 'automate':
        # Clockwork planetary gyro gear ring with rotation ticks
        gear_r = 30
        draw.ellipse([cx - gear_r, oy - gear_r//2, cx + gear_r, oy + gear_r//2], outline=fn_color, width=4)
        for deg in range(0, 360, 45):
            rad = math.radians(deg)
            gx = cx + int(gear_r * math.cos(rad))
            gy = oy + int((gear_r // 2) * math.sin(rad))
            draw.ellipse([gx - 4, gy - 3, gx + 4, gy + 3], fill=tc['specular'])
    elif axis == 'luck':
        # Faceted polyhedral quantum dice & celestial starburst
        star_pts = []
        for i in range(8):
            deg = i * 45
            rad = math.radians(deg)
            sr = 34 if (i % 2 == 0) else 16
            sx = cx + int(sr * math.cos(rad))
            sy = oy + int((sr * 0.55) * math.sin(rad))
            star_pts.append((sx, sy))
        draw.polygon(star_pts, fill=fn_color)
        draw.polygon(star_pts, outline=tc['specular'], width=2)
        draw.ellipse([cx - 8, oy - 4, cx + 8, oy + 4], fill=(255, 255, 255, 255))

    # 5. Core Internal Glow Layer
    glow_im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_im)
    glow_radius = int(35 * tc['glow_intensity'])
    glow_color = fn_color if tier < 4 else tc['specular']
    glow_draw.ellipse([
        cx - glow_radius, oy + r//2 - glow_radius,
        cx + glow_radius, oy + r//2 + glow_radius
    ], fill=glow_color)
    glow_im = glow_im.filter(ImageFilter.GaussianBlur(18))
    im = Image.alpha_composite(im, glow_im)

    # 6. Smooth anti-aliased downscaling to 256x256
    out_im = im.resize((256, 256), Image.Resampling.LANCZOS)
    return out_im

def render_25d_milestone_icon(milestone_id, name, rarity, category):
    """
    Renders a unique 2.5D milestone upgrade artifact adhering to its rarity tier.
    """
    S = 512
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    cx, cy = S // 2, S // 2 + 10

    # Determine material palette based on rarity
    if rarity == 'common' or rarity == 'uncommon':
        tier = 2 # Titanium
        accent = (88, 217, 255, 255)
    elif rarity == 'rare':
        tier = 3 # Gold
        accent = (255, 200, 87, 255)
    elif rarity == 'monumental':
        tier = 4 # Liquid Glass
        accent = (167, 120, 255, 255)
    else: # ethereal
        tier = 5 # Ethereal Liquid Metal
        accent = (244, 63, 94, 255)

    tc = TIER_CONFIGS[tier]

    # Contact Shadow
    s_im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(s_im)
    s_draw.ellipse([cx - 160, cy + 60 - 70, cx + 160, cy + 60 + 70], fill=(0, 0, 0, 150))
    s_im = s_im.filter(ImageFilter.GaussianBlur(26))
    im = Image.alpha_composite(im, s_im)
    draw = ImageDraw.Draw(im)

    # Base Pedestal / Plinth
    base_w, base_h = 140, 70
    depth = 32
    draw.polygon([
        (cx - base_w, cy), (cx, cy + base_h),
        (cx, cy + base_h + depth), (cx - base_w, cy + depth)
    ], fill=tc['left'])
    draw.polygon([
        (cx, cy + base_h), (cx + base_w, cy),
        (cx + base_w, cy + depth), (cx, cy + base_h + depth)
    ], fill=tc['right'])
    draw.polygon([
        (cx, cy - base_h), (cx + base_w, cy),
        (cx, cy + base_h), (cx - base_w, cy)
    ], fill=tc['top'])
    draw.line([
        (cx, cy - base_h), (cx + base_w, cy),
        (cx, cy + base_h), (cx - base_w, cy), (cx, cy - base_h)
    ], fill=tc['rim'], width=3)

    # Hero Floating 2.5D Monolith / Artifact
    oy = cy - 50
    h_w, h_h = 85, 110
    
    # 3D Monolith facets
    mono_top = [
        (cx, oy - h_h), (cx + h_w, oy - h_h + 40),
        (cx, oy - h_h + 80), (cx - h_w, oy - h_h + 40)
    ]
    mono_left = [
        (cx - h_w, oy - h_h + 40), (cx, oy - h_h + 80),
        (cx, oy + 40), (cx - h_w, oy)
    ]
    mono_right = [
        (cx, oy - h_h + 80), (cx + h_w, oy - h_h + 40),
        (cx + h_w, oy), (cx, oy + 40)
    ]

    draw.polygon(mono_left, fill=tc['left'])
    draw.polygon(mono_right, fill=tc['right'])
    draw.polygon(mono_top, fill=tc['top'])

    draw.line(mono_top + [mono_top[0]], fill=tc['specular'], width=3)
    draw.line(mono_left + [mono_left[0]], fill=tc['rim'], width=2)
    draw.line(mono_right + [mono_right[0]], fill=tc['rim'], width=2)
    draw.line([(cx, oy - h_h + 80), (cx, oy + 40)], fill=tc['specular'], width=3)

    # Engraved Rune / Central Circuit Aperture
    draw.ellipse([cx - 28, oy - 14, cx + 28, oy + 14], outline=accent, width=3)
    draw.line([(cx - 40, oy), (cx + 40, oy)], fill=accent, width=2)
    draw.line([(cx, oy - 20), (cx, oy + 20)], fill=accent, width=2)

    # Radiant Glow Core
    g_im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(g_im)
    g_draw.ellipse([cx - 35, oy - 20, cx + 35, oy + 20], fill=accent)
    g_im = g_im.filter(ImageFilter.GaussianBlur(20))
    im = Image.alpha_composite(im, g_im)

    # Downsample to 256x256
    return im.resize((256, 256), Image.Resampling.LANCZOS)

def main():
    print("=== STARTING 2.5D ASSET PRODUCTION PIPELINE ===")
    
    # 1. GENERATE ALL 120 SKILL TREE UPGRADES
    total_skills = 0
    for fn_id in FUNCTIONS:
        for axis in AXES:
            for tier in range(1, 6):
                fname = f"{fn_id}_{axis}_t{tier}.png"
                out_path = os.path.join(SKILLS_DIR, fname)
                icon_im = render_25d_skill_icon(fn_id, axis, tier)
                icon_im.save(out_path)
                total_skills += 1
    print(f"✓ Generated {total_skills} Skill Tree icons in {SKILLS_DIR}")

    # 2. GENERATE ALL 35 MILESTONE UPGRADES
    # List of all 35 milestones from RAW_RELICS
    milestones = [
        ('milestone_prompt_firewall.png', 'relic-vibe-coder', 'Prompt Firewall', 'common', 'product'),
        ('milestone_self_healing.png', 'relic-circuit-breaker', 'Self-Healing Mesh', 'common', 'operations'),
        ('milestone_dark_fiber.png', 'relic-dark-fiber', 'Dark Fiber Trunk', 'common', 'operations'),
        ('milestone_viral_repo.png', 'relic-open-source', 'Viral Git Monolith', 'common', 'demand'),
        ('milestone_gpu_cluster.png', 'relic-gpu-cluster', 'GPU Compute Hive', 'rare', 'operations'),
        ('milestone_procurement_passkey.png', 'relic-stealth-moat', 'Procurement Passkey', 'rare', 'monetisation'),
        ('milestone_negative_churn.png', 'relic-negative-churn', 'Expansion Gravity Core', 'rare', 'retention'),
        ('milestone_algo_pricing.png', 'relic-algo-pricing', 'Algorithmic Price Puck', 'rare', 'monetisation'),
        ('milestone_seed_syndicate.png', 'relic-syndicate', 'Seed Syndicate Syndicate', 'rare', 'finance'),
        ('milestone_soc2_vault.png', 'relic-soc2-fasttrack', 'SOC2 Compliance Vault', 'rare', 'operations'),
        ('milestone_direct_debit.png', 'relic-direct-debit', 'Direct ACH Conduit', 'rare', 'monetisation'),
        ('milestone_auto_compiler.png', 'relic-auto-compiler', 'Autonomous AST Foundry', 'rare', 'product'),
        ('milestone_reality_distortion.png', 'relic-anisotropic-sheen', 'Reality Distortion Prism', 'rare', 'finance'),
        ('milestone_sovereign_grant.png', 'relic-sovereign-grant', 'Sovereign AI Grant', 'monumental', 'finance'),
        ('milestone_holding_swarm.png', 'relic-holding-swarm', 'Conglomerate Matrix', 'monumental', 'expansion'),
        ('milestone_anti_fragile.png', 'relic-anti-fragile', 'Hydraulic Buffer', 'rare', 'operations'),
        ('milestone_cold_outreach.png', 'relic-cold-outreach', 'Sub-Zero Transmitter', 'common', 'demand'),
        ('milestone_feature_flags.png', 'relic-feature-flags', 'Feature Flag Switchboard', 'common', 'product'),
        ('milestone_tam_expansion.png', 'relic-tam-expansion', 'Market Telescope', 'rare', 'demand'),
        ('milestone_ops_telemetry.png', 'relic-ops-telemetry', 'Oscilloscope HUD', 'common', 'operations'),
        ('milestone_micro_pods.png', 'relic-sub-pod-buffer', 'Zero-Copy Micro-Pods', 'rare', 'expansion'),
        ('milestone_nps_flywheel.png', 'relic-customer-advocacy', 'NPS Flywheel', 'rare', 'demand'),
        ('milestone_quantum_annealing.png', 'relic-quantum-annealing', 'Quantum Annealing Core', 'monumental', 'expansion'),
        ('milestone_executive_network.png', 'relic-silicon-mafia', 'Mafia Executive Signet', 'monumental', 'demand'),
        ('milestone_debt_arbitrage.png', 'relic-debt-arbitrage', 'Treasury Arbitrage Scale', 'monumental', 'finance'),
        ('milestone_zk_enclave.png', 'relic-zk-proofs', 'ZK Enclave Vault', 'monumental', 'operations'),
        ('milestone_shadow_fleet.png', 'relic-shadow-fleet', 'Shadow Overclock Battery', 'monumental', 'operations'),
        ('milestone_neural_distillation.png', 'relic-neural-distillation', 'Model Distillation Flask', 'monumental', 'product'),
        ('milestone_churn_interceptor.png', 'relic-algorithmic-upsell', 'Predictive Churn Interceptor', 'monumental', 'retention'),
        ('milestone_erlang_matrix.png', 'relic-hyper-concurrency', 'Erlang Actor Matrix', 'monumental', 'operations'),
        ('milestone_viral_monolith.png', 'relic-viral-monolith', 'Monolith of Network Effects', 'ethereal', 'demand'),
        ('milestone_narrative_engine.png', 'relic-pre-ipo-distortion', 'Wall Street Narrative Engine', 'ethereal', 'finance'),
        ('milestone_singularity_core.png', 'relic-singularity-supercore', 'Singularity AGI Core', 'ethereal', 'operations'),
        ('milestone_defense_monopoly.png', 'relic-defense-monopoly', 'Classified Defense Seal', 'ethereal', 'finance'),
        ('milestone_infinite_runway.png', 'relic-immortal-balance', 'Infinite Runway Ouroboros', 'ethereal', 'finance'),
    ]

    total_milestones = 0
    for fname, mid, name, rarity, category in milestones:
        out_p = os.path.join(MILESTONES_DIR, fname)
        # If file already exists from high-res Nano Banana Pro generation, preserve it!
        if os.path.exists(out_p) and os.path.getsize(out_p) > 20000:
            print(f"→ Preserving high-res Nano Banana Pro milestone: {fname}")
        else:
            m_im = render_25d_milestone_icon(mid, name, rarity, category)
            m_im.save(out_p)
            print(f"✓ Rendered milestone 2.5D asset: {fname}")
        total_milestones += 1

    print(f"✓ Total {total_milestones} Milestone Upgrade assets in {MILESTONES_DIR}")
    print("=== ASSET PRODUCTION COMPLETE ===")

if __name__ == '__main__':
    main()
