#!/usr/bin/env python3
"""Generate app icons and splash screen for ConjuGo KR."""

from PIL import Image, ImageDraw, ImageFont
import os

ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets')

# Colors — Korean flag inspired
BLUE = '#003478'
RED = '#C60C30'
WHITE = '#FFFFFF'
DARK_BG = '#001F4D'

CJK_FONT_PATH = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
CJK_FONT_INDEX = 1  # index 1 = Noto Sans CJK KR Bold
LATIN_FONT_PATH = '/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf'


def draw_rounded_rect(draw, xy, radius, fill):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.pieslice([x0, y0, x0 + 2 * radius, y0 + 2 * radius], 180, 270, fill=fill)
    draw.pieslice([x1 - 2 * radius, y0, x1, y0 + 2 * radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2 * radius, x0 + 2 * radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2 * radius, y1 - 2 * radius, x1, y1], 0, 90, fill=fill)


def generate_icon(size, output_name, adaptive=False):
    """Generate an app icon."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if adaptive:
        # Adaptive icon: full bleed, no rounded corners
        draw.rectangle([0, 0, size, size], fill=BLUE)
        padding = size * 0.2
    else:
        # Regular icon: rounded corners
        corner_radius = size // 5
        draw_rounded_rect(draw, (0, 0, size, size), corner_radius, BLUE)
        padding = size * 0.12

    cx, cy = size / 2, size / 2

    # Draw a stylized 한 character outline (simplified)
    # Instead, let's do a clean typographic design
    # Top: "ConjuGo" small text
    # Center: Large Korean character 한
    # Bottom: "KR" badge

    # Main text: 한 (Korean character for "Korean")
    try:
        main_font_size = int(size * 0.38)
        main_font = ImageFont.truetype(CJK_FONT_PATH, main_font_size, index=CJK_FONT_INDEX)
    except:
        main_font = ImageFont.load_default()

    main_text = '한'
    bbox = draw.textbbox((0, 0), main_text, font=main_font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - tw / 2, cy - th / 2 - size * 0.06), main_text, fill=WHITE, font=main_font)

    # "KR" badge at bottom
    try:
        badge_font_size = int(size * 0.12)
        badge_font = ImageFont.truetype(LATIN_FONT_PATH, badge_font_size)
    except:
        badge_font = ImageFont.load_default()

    badge_text = 'KR'
    bbox2 = draw.textbbox((0, 0), badge_text, font=badge_font)
    bw, bh = bbox2[2] - bbox2[0], bbox2[3] - bbox2[1]

    # Red pill badge
    badge_pad_x = size * 0.04
    badge_pad_y = size * 0.02
    badge_x = cx - bw / 2 - badge_pad_x
    badge_y = cy + th / 2 - size * 0.02
    badge_radius = int(size * 0.04)
    draw_rounded_rect(draw,
                      (badge_x, badge_y, badge_x + bw + badge_pad_x * 2, badge_y + bh + badge_pad_y * 2),
                      badge_radius, RED)
    draw.text((badge_x + badge_pad_x, badge_y + badge_pad_y), badge_text, fill=WHITE, font=badge_font)

    img.save(os.path.join(ASSETS_DIR, output_name))
    print(f'  Generated {output_name} ({size}x{size})')


def generate_favicon(size=48):
    """Generate a small favicon."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    corner_radius = size // 5
    draw_rounded_rect(draw, (0, 0, size, size), corner_radius, BLUE)

    try:
        font = ImageFont.truetype(CJK_FONT_PATH, int(size * 0.5), index=CJK_FONT_INDEX)
    except:
        font = ImageFont.load_default()

    text = '한'
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((size / 2 - tw / 2, size / 2 - th / 2 - 2), text, fill=WHITE, font=font)

    img.save(os.path.join(ASSETS_DIR, 'favicon.png'))
    print(f'  Generated favicon.png ({size}x{size})')


def generate_splash(width=1284, height=2778):
    """Generate splash screen."""
    img = Image.new('RGB', (width, height), BLUE)
    draw = ImageDraw.Draw(img)

    cx, cy = width / 2, height / 2

    # Large 한 character
    try:
        main_font = ImageFont.truetype(CJK_FONT_PATH, int(width * 0.3), index=CJK_FONT_INDEX)
    except:
        main_font = ImageFont.load_default()

    main_text = '한'
    bbox = draw.textbbox((0, 0), main_text, font=main_font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - tw / 2, cy - th / 2 - height * 0.08), main_text, fill=WHITE, font=main_font)

    # "ConjuGo KR" text below
    try:
        sub_font = ImageFont.truetype(LATIN_FONT_PATH, int(width * 0.06))
    except:
        sub_font = ImageFont.load_default()

    sub_text = 'ConjuGo KR'
    bbox2 = draw.textbbox((0, 0), sub_text, font=sub_font)
    sw = bbox2[2] - bbox2[0]
    draw.text((cx - sw / 2, cy + th / 2 - height * 0.04), sub_text, fill=WHITE, font=sub_font)

    # Red accent line
    line_w = int(width * 0.15)
    line_h = 6
    draw.rectangle([cx - line_w / 2, cy + th / 2 + height * 0.02,
                     cx + line_w / 2, cy + th / 2 + height * 0.02 + line_h], fill=RED)

    img.save(os.path.join(ASSETS_DIR, 'splash.png'))
    print(f'  Generated splash.png ({width}x{height})')


if __name__ == '__main__':
    print('Generating ConjuGo KR assets...')
    generate_icon(1024, 'icon.png')
    generate_icon(1024, 'adaptive-icon.png', adaptive=True)
    generate_favicon(48)
    generate_splash()
    print('Done!')
