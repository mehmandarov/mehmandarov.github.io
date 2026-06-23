#!/usr/bin/env python3
"""Generate a minimal social preview image using the profile photo."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PHOTO_PATH = ROOT / "assets/images/profile_large.jpg"
OUT_PNG = ROOT / "assets/images/social-preview.png"
OUT_JPG = ROOT / "assets/images/social-preview.jpg"

WIDTH = 1200
HEIGHT = 630


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    font_paths = [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica.ttc",
        "/System/Library/Fonts/SFNS.ttf",
    ]
    for font_path in font_paths:
        try:
            return ImageFont.truetype(font_path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def make_preview() -> None:
    img = Image.new("RGB", (WIDTH, HEIGHT), "#F8FAFC")

    # Add subtle modern color accents behind the card.
    for radius, color, alpha, center_x, center_y in [
        (420, (99, 102, 241), 36, -60, -80),
        (300, (14, 165, 233), 30, 1030, -40),
        (260, (16, 185, 129), 28, 1160, 540),
    ]:
        layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)
        draw.ellipse(
            (center_x - radius, center_y - radius, center_x + radius, center_y + radius),
            fill=(*color, alpha),
        )
        layer = layer.filter(ImageFilter.GaussianBlur(40))
        img = Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")

    card_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card_layer)
    margin = 42
    radius = 28
    rect = (margin, margin, WIDTH - margin, HEIGHT - margin)
    card_draw.rounded_rectangle(
        (rect[0] + 4, rect[1] + 8, rect[2] + 4, rect[3] + 8),
        radius=radius,
        fill=(15, 23, 42, 22),
    )
    card_draw.rounded_rectangle(
        rect,
        radius=radius,
        fill=(255, 255, 255, 248),
        outline=(226, 232, 240, 255),
        width=2,
    )
    img = Image.alpha_composite(img.convert("RGBA"), card_layer).convert("RGB")
    draw = ImageDraw.Draw(img)

    title_font = load_font(84)
    sub_font = load_font(40)

    text_x = 110
    text_y = 188
    draw.rounded_rectangle((text_x, text_y - 30, text_x + 210, text_y - 20), radius=4, fill="#2563EB")
    draw.text((text_x, text_y), "mehmandarov.com", font=title_font, fill="#0F172A")
    draw.text(
        (text_x, text_y + 110),
        "Insights on software architecture, AI, \nand security.",
        font=sub_font,
        fill="#475569",
    )

    photo = Image.open(PHOTO_PATH).convert("RGB")
    size = 260
    photo = ImageOps.fit(photo, (size, size), method=Image.Resampling.LANCZOS)

    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse((0, 0, size - 1, size - 1), fill=255)

    img_rgba = img.convert("RGBA")
    photo_x, photo_y = 860, 185

    shadow = Image.new("RGBA", (size + 24, size + 24), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.ellipse((12, 12, size + 12, size + 12), fill=(15, 23, 42, 65))
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    img_rgba.alpha_composite(shadow, (photo_x - 12, photo_y - 6))

    ring = Image.new("RGBA", (size + 20, size + 20), (0, 0, 0, 0))
    ring_draw = ImageDraw.Draw(ring)
    ring_draw.ellipse((0, 0, size + 19, size + 19), fill=(255, 255, 255, 255), outline=(148, 163, 184, 180), width=2)
    img_rgba.alpha_composite(ring, (photo_x - 10, photo_y - 10))

    clipped_photo = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    clipped_photo.paste(photo, (0, 0), mask)
    img_rgba.alpha_composite(clipped_photo, (photo_x, photo_y))

    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    final = img_rgba.convert("RGB")
    final.save(OUT_PNG, optimize=True)
    final.save(OUT_JPG, quality=92, optimize=True)


if __name__ == "__main__":
    make_preview()
    print(f"Generated: {OUT_PNG}")
    print(f"Generated: {OUT_JPG}")
