"""
Create promotional videos and a social poster for Ultimate 5-a-side Draft Game.

Outputs created by this script:
- ultimate5aside_promo_portrait_tiktok.mp4   1080x1920, <20 seconds
- ultimate5aside_promo_landscape_youtube.mp4 1920x1080, <20 seconds
- ultimate5aside_social_poster.png           1080x1350 poster

How to customise:
- Edit SCRIPT_TITLE, CTA_URL or SCENES near the top.
- Edit COLOURS if you want different styling.
- Replace the screenshot filenames in SCREENSHOT_FILES if you want to force a specific order.
- Adjust FPS or VIDEO_SECONDS, but keep VIDEO_SECONDS below 20 for TikTok/Reels/Shorts style ads.

Dependencies:
- pillow (PIL)
- opencv-python (cv2)
- numpy

No internet access is required. The script uses local screenshots and logo files from the same folder.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import numpy as np
import cv2
import math
import os

# -----------------------------------------------------------------------------
# USER-EDITABLE SETTINGS
# -----------------------------------------------------------------------------
SCRIPT_TITLE = "Ultimate 5-a-side Draft Game"
CTA_URL = "ultimate5aside.app"
VIDEO_SECONDS = 15             # Keep below 20 seconds as requested.
FPS = 15                       # 15 fps keeps files smaller and renders quicker; still smooth for social promos.

# If these files exist, they will be used in this order.
# If a file is missing, the script will just skip it.
SCREENSHOT_FILES = [
    "screenshot.png",
]
LOGO_FILES = [
    "Ultimate 5-a-side LOGO.png",
    "Ultimate 5-a-side LOGO TRANSPARENT.png",
]

# Main brand colours.
COLOURS = {
    "navy": (7, 17, 31),
    "deep": (15, 23, 42),
    "blue": (37, 99, 235),
    "blue2": (29, 78, 216),
    "green": (34, 197, 94),
    "white": (255, 255, 255),
    "muted": (203, 213, 225),
    "gold": (245, 158, 11),
}

# Text/storyboard. Each scene runs for 3 seconds; total = 18 seconds.
SCENES = [
    {
        "kicker": "FREE FOOTBALL DRAFT GAME",
        "headline": "Build your ultimate 5-a-side team",
        "body": "Pick players from iconic seasons, complete every position and chase the highest rating.",
        "badge": "SOLO OR ONLINE",
    },
    {
        "kicker": "HOW TO PLAY",
        "headline": "1. Choose your mode",
        "body": "Play Solo Challenge, Ultimate Solo Mode, Easy Solo or create an online room with friends.",
        "badge": "STEP 1",
    },
    {
        "kicker": "DRAFT TIME",
        "headline": "2. Pick, accept or decline",
        "body": "Take the player, gamble with a decline, or bid against friends in online modes.",
        "badge": "STEP 2",
    },
    {
        "kicker": "BUILD YOUR XI... WELL, FIVE",
        "headline": "3. Fill the 5 positions",
        "body": "GK • DEF • MID • MID • FWD. Every decision shapes your final score.",
        "badge": "STEP 3",
    },
    {
        "kicker": "FINAL WHISTLE",
        "headline": "4. Reveal the ratings",
        "body": "Can your team beat your friends and climb the leaderboard?",
        "badge": "STEP 4",
    },
    {
        "kicker": "PLAY NOW",
        "headline": "Draft legends. Challenge friends. Climb the leaderboard.",
        "body": CTA_URL,
        "badge": "ULTIMATE 5-A-SIDE",
    },
]

# -----------------------------------------------------------------------------
# FONT HELPERS
# -----------------------------------------------------------------------------
def find_font(preferred="DejaVuSans-Bold.ttf"):
    """Find a usable system font. DejaVu is usually available in Linux/Python."""
    candidates = [
        "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
        preferred,
    ]
    for f in candidates:
        if Path(f).exists():
            return f
    return None

FONT_BOLD = find_font("DejaVuSans-Bold.ttf")
FONT_REG = "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf" if Path("/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf").exists() else FONT_BOLD

def font(size, bold=True):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size=size)

# -----------------------------------------------------------------------------
# IMAGE HELPERS
# -----------------------------------------------------------------------------
def load_rgba(path):
    """Load an image as RGBA, returning None if not found."""
    p = Path(path)
    if not p.exists():
        return None
    return Image.open(p).convert("RGBA")

def cover_resize(img, size):
    """Resize/crop image so it completely covers the target area."""
    target_w, target_h = size
    src_w, src_h = img.size
    scale = max(target_w / src_w, target_h / src_h)
    new_size = (int(src_w * scale), int(src_h * scale))
    img2 = img.resize(new_size, Image.LANCZOS)
    left = (img2.width - target_w) // 2
    top = (img2.height - target_h) // 2
    return img2.crop((left, top, left + target_w, top + target_h))

def contain_resize(img, max_size):
    """Resize image to fit inside max_size without cropping."""
    max_w, max_h = max_size
    scale = min(max_w / img.width, max_h / img.height)
    return img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS)

def rounded_rectangle(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def paste_center(base, overlay, center, shadow=True):
    """Paste overlay image centred on base, optionally with soft shadow."""
    x = int(center[0] - overlay.width / 2)
    y = int(center[1] - overlay.height / 2)
    if shadow:
        shadow_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
        sdraw = ImageDraw.Draw(shadow_layer)
        sdraw.rounded_rectangle((x + 15, y + 18, x + overlay.width + 15, y + overlay.height + 18), 36, fill=(0, 0, 0, 120))
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(20))
        base.alpha_composite(shadow_layer)
    base.alpha_composite(overlay, (x, y))

def text_size(draw, text, fnt):
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]

def draw_text(draw, xy, text, fnt, fill, anchor=None, shadow=True, align="left", spacing=8):
    """Draw text with a subtle shadow for strong social-video readability."""
    x, y = xy
    if shadow:
        draw.text((x + 2, y + 3), text, font=fnt, fill=(0, 0, 0, 130), anchor=anchor, align=align, spacing=spacing)
    draw.text((x, y), text, font=fnt, fill=fill, anchor=anchor, align=align, spacing=spacing)

def wrap_text(draw, text, fnt, max_width):
    """Simple word-wrap for overlay copy."""
    words = text.split()
    lines, current = [], ""
    for word in words:
        test = f"{current} {word}".strip()
        if text_size(draw, test, fnt)[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return "\n".join(lines)

_GRADIENT_CACHE = {}
_BG_CACHE = {}
_CARD_CACHE = {}

def make_gradient_bg(size, t=0):
    """Create a dark blue/green football-style gradient background.

    The gradient is cached per canvas size because it is used for every frame.
    This keeps rendering fast while preserving the polished dark football look.
    """
    if size in _GRADIENT_CACHE:
        return _GRADIENT_CACHE[size].copy()

    w, h = size
    yy, xx = np.mgrid[0:h, 0:w]
    nx = xx / float(w)
    ny = yy / float(h)

    glow1 = np.exp(-((nx - 0.10) ** 2 + (ny - 0.10) ** 2) / 0.10)
    glow2 = np.exp(-((nx - 0.90) ** 2 + (ny - 0.25) ** 2) / 0.08)
    glow3 = np.exp(-((nx - 0.50) ** 2 + (ny - 0.95) ** 2) / 0.18)

    base = np.zeros((h, w, 3), dtype=np.float32)
    base[:] = np.array(COLOURS["navy"], dtype=np.float32)
    base += glow1[..., None] * np.array([20, 55, 125], dtype=np.float32)
    base += glow2[..., None] * np.array([10, 95, 55], dtype=np.float32)
    base += glow3[..., None] * np.array([15, 30, 70], dtype=np.float32)

    arr = np.clip(base, 0, 255).astype(np.uint8)
    img = Image.fromarray(arr, "RGB").convert("RGBA")
    _GRADIENT_CACHE[size] = img.copy()
    return img

def make_screenshot_card(img, max_size, border=(255, 255, 255, 230)):
    """Create a rounded screenshot card for use in the video."""
    shot = contain_resize(img, max_size).convert("RGBA")
    # Slight enhancement so screenshots read well after video compression.
    shot = ImageEnhance.Contrast(shot).enhance(1.05)
    shot = ImageEnhance.Sharpness(shot).enhance(1.08)
    pad = 14
    card = Image.new("RGBA", (shot.width + pad * 2, shot.height + pad * 2), (255, 255, 255, 0))
    mask = Image.new("L", card.size, 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.rounded_rectangle((0, 0, card.width, card.height), radius=38, fill=255)
    bg = Image.new("RGBA", card.size, (255, 255, 255, 235))
    bg.putalpha(mask)
    card.alpha_composite(bg)
    card.alpha_composite(shot, (pad, pad))
    outline = Image.new("RGBA", card.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(outline)
    od.rounded_rectangle((2, 2, card.width - 3, card.height - 3), 38, outline=border, width=3)
    card.alpha_composite(outline)
    return card

def load_assets():
    """Load screenshots/logo in a stable order."""
    screenshots = []
    for name in SCREENSHOT_FILES:
        im = load_rgba(name)
        if im is not None:
            screenshots.append((name, im))

    # Fallback: use any PNG except logos if screenshot list is unavailable.
    if not screenshots:
        for p in Path(".").glob("*.png"):
            if "LOGO" not in p.name.upper():
                screenshots.append((p.name, load_rgba(p)))

    logo = None
    for name in LOGO_FILES:
        logo = load_rgba(name)
        if logo is not None:
            break
    return screenshots, logo

# -----------------------------------------------------------------------------
# DESIGN ELEMENTS
# -----------------------------------------------------------------------------
def draw_logo_and_brand(canvas, logo, w, h, compact=False):
    """Top-left brand header."""
    draw = ImageDraw.Draw(canvas)
    margin = 56 if not compact else 38
    logo_size = 82 if not compact else 62
    if logo is not None:
        lg = contain_resize(logo, (logo_size, logo_size))
        canvas.alpha_composite(lg, (margin, margin))
        tx = margin + logo_size + 20
    else:
        tx = margin
    draw_text(draw, (tx, margin + 2), "Ultimate 5-a-side", font(40 if not compact else 30), COLOURS["white"], shadow=True)
    draw_text(draw, (tx, margin + (50 if not compact else 38)), "Draft Game", font(27 if not compact else 21, False), COLOURS["muted"], shadow=True)

def draw_pill(draw, xy, text, colour, size=28):
    """Draw a rounded badge/pill."""
    x, y = xy
    f = font(size)
    tw, th = text_size(draw, text, f)
    pad_x, pad_y = 22, 12
    box = (x, y, x + tw + pad_x * 2, y + th + pad_y * 2)
    draw.rounded_rectangle(box, radius=999, fill=colour)
    draw.text((x + pad_x, y + pad_y - 2), text, font=f, fill=COLOURS["white"])
    return box

def draw_how_to_play_steps(draw, x, y, scale=1.0):
    """On-screen 'how to play' micro guide."""
    steps = [
        ("1", "Choose", "Solo or Online"),
        ("2", "Pick", "Accept / Decline"),
        ("3", "Build", "Fill 5 slots"),
        ("4", "Reveal", "Highest wins"),
    ]
    gap = int(208 * scale)
    for i, (num, title, sub) in enumerate(steps):
        cx = x + i * gap
        draw.ellipse((cx, y, cx + int(52*scale), y + int(52*scale)), fill=(37, 99, 235), outline=(191, 219, 254), width=2)
        draw.text((cx + int(26*scale), y + int(10*scale)), num, font=font(int(24*scale)), fill=COLOURS["white"], anchor="ma")
        draw.text((cx + int(26*scale), y + int(65*scale)), title, font=font(int(24*scale)), fill=COLOURS["white"], anchor="ma")
        draw.text((cx + int(26*scale), y + int(96*scale)), sub, font=font(int(17*scale), False), fill=COLOURS["muted"], anchor="ma")
        if i < len(steps) - 1:
            ax = cx + int(72*scale)
            draw.line((ax, y + int(26*scale), ax + int(96*scale), y + int(26*scale)), fill=(96, 165, 250), width=max(2, int(3*scale)))
            draw.polygon([(ax + int(96*scale), y + int(26*scale)), (ax + int(84*scale), y + int(18*scale)), (ax + int(84*scale), y + int(34*scale))], fill=(96, 165, 250))

# -----------------------------------------------------------------------------
# FRAME RENDERING
# -----------------------------------------------------------------------------
def scene_progress(global_frame):
    """Return scene index and local progress 0..1."""
    frames_per_scene = int((VIDEO_SECONDS / len(SCENES)) * FPS)
    scene_idx = min(len(SCENES) - 1, global_frame // frames_per_scene)
    local = (global_frame % frames_per_scene) / max(1, frames_per_scene - 1)
    return scene_idx, local

def ease_out(x):
    return 1 - (1 - x) ** 3

def render_frame(size, frame_idx, screenshots, logo, orientation):
    """Render one animation frame."""
    w, h = size
    scene_idx, p = scene_progress(frame_idx)
    scene = SCENES[scene_idx]
    base = make_gradient_bg(size, frame_idx / (FPS * VIDEO_SECONDS))
    draw = ImageDraw.Draw(base)

    # Background screenshot blur layer. Cached per scene/size for speed.
    shot_name, shot_img = screenshots[scene_idx % len(screenshots)]
    bg_key = (shot_name, size)
    if bg_key not in _BG_CACHE:
        bg_cached = cover_resize(shot_img, size).filter(ImageFilter.GaussianBlur(18))
        bg_cached = ImageEnhance.Brightness(bg_cached).enhance(0.35).convert("RGBA")
        _BG_CACHE[bg_key] = bg_cached
    bg = _BG_CACHE[bg_key]
    base = Image.alpha_composite(base, bg)
    draw = ImageDraw.Draw(base)

    # Subtle animated pitch lines / diagonal streaks.
    line_alpha = 38
    for i in range(-3, 8):
        offset = int((p * 80) % 80)
        x0 = i * 320 + offset
        draw.line((x0, h, x0 + 620, 0), fill=(255, 255, 255, line_alpha), width=2)

    draw_logo_and_brand(base, logo, w, h, compact=(orientation == "portrait"))

    # Screenshot card with Ken Burns zoom.
    zoom = 1.0 + 0.035 * ease_out(p)
    if orientation == "landscape":
        card_max = (900, 610)
        card_key = (shot_name, card_max)
        if card_key not in _CARD_CACHE:
            _CARD_CACHE[card_key] = make_screenshot_card(shot_img, card_max)
        card = _CARD_CACHE[card_key]
        if zoom != 1:
            card = card.resize((int(card.width * zoom), int(card.height * zoom)), Image.LANCZOS)
        paste_center(base, card, (int(w * 0.68), int(h * 0.54)), shadow=True)
        text_x, text_y = 90, 260
        max_text_w = 720
        badge_y = 210
        title_size = 64
        body_size = 30
    else:
        card_max = (860, 790)
        card_key = (shot_name, card_max)
        if card_key not in _CARD_CACHE:
            _CARD_CACHE[card_key] = make_screenshot_card(shot_img, card_max)
        card = _CARD_CACHE[card_key]
        if zoom != 1:
            card = card.resize((int(card.width * zoom), int(card.height * zoom)), Image.LANCZOS)
        paste_center(base, card, (int(w * 0.5), int(h * 0.61)), shadow=True)
        text_x, text_y = 70, 220
        max_text_w = 940
        badge_y = 172
        title_size = 64
        body_size = 31

    # Animated text fade/slide.
    fade = min(1.0, p * 4) * min(1.0, (1 - p) * 5 if p > 0.82 else 1.0)
    slide = int((1 - ease_out(min(1, p * 2))) * 45)
    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    alpha_white = int(255 * fade)
    alpha_muted = int(225 * fade)

    draw_pill(od, (text_x, badge_y - slide), scene["badge"], COLOURS["blue"], size=22 if orientation == "portrait" else 24)

    headline_wrapped = wrap_text(od, scene["headline"], font(title_size), max_text_w)
    body_wrapped = wrap_text(od, scene["body"], font(body_size, False), max_text_w)
    od.text((text_x + 2, text_y - slide + 3), headline_wrapped, font=font(title_size), fill=(0, 0, 0, int(140 * fade)), spacing=8)
    od.text((text_x, text_y - slide), headline_wrapped, font=font(title_size), fill=(255, 255, 255, alpha_white), spacing=8)

    body_y = text_y + (145 if orientation == "landscape" else 165)
    od.text((text_x + 2, body_y - slide + 3), body_wrapped, font=font(body_size, False), fill=(0, 0, 0, int(120 * fade)), spacing=8)
    od.text((text_x, body_y - slide), body_wrapped, font=font(body_size, False), fill=(203, 213, 225, alpha_muted), spacing=8)

    # How-to-play steps appear most clearly on final frame / middle scenes.
    if scene_idx in [1, 2, 3, 4, 5]:
        if orientation == "landscape":
            draw_how_to_play_steps(od, 96, 790, scale=0.82)
        else:
            # Compact vertical checklist style.
            checklist_y = 1260
            steps = ["Choose mode", "Pick players", "Build team", "Reveal ratings"]
            for i, txt in enumerate(steps):
                y = checklist_y + i * 78
                od.rounded_rectangle((72, y, 1008, y + 56), radius=22, fill=(15, 23, 42, int(205 * fade)), outline=(96, 165, 250, int(170 * fade)), width=2)
                od.ellipse((94, y + 13, 124, y + 43), fill=(34, 197, 94, int(255 * fade)))
                od.text((146, y + 12), f"{i+1}. {txt}", font=font(26), fill=(255, 255, 255, alpha_white))

    base = Image.alpha_composite(base, overlay)
    draw = ImageDraw.Draw(base)

    # Bottom CTA bar.
    bar_h = 96 if orientation == "landscape" else 120
    bar = Image.new("RGBA", (w, bar_h), (15, 23, 42, 218))
    bdraw = ImageDraw.Draw(bar)
    bdraw.rounded_rectangle((50, 18, w - 50, bar_h - 18), radius=999, fill=(37, 99, 235, 240))
    cta = "Play free now: " + CTA_URL
    bdraw.text((w // 2, bar_h // 2), cta, font=font(34 if orientation == "landscape" else 32), fill=COLOURS["white"], anchor="mm")
    base.alpha_composite(bar, (0, h - bar_h - 28))

    return base.convert("RGB")

# -----------------------------------------------------------------------------
# VIDEO WRITING
# -----------------------------------------------------------------------------
def write_video(output_path, size, screenshots, logo, orientation):
    """Write an MP4 using OpenCV VideoWriter."""
    total_frames = int(VIDEO_SECONDS * FPS)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(output_path), fourcc, FPS, size)
    if not writer.isOpened():
        raise RuntimeError(f"Could not open video writer for {output_path}")

    for frame_idx in range(total_frames):
        frame = render_frame(size, frame_idx, screenshots, logo, orientation)
        # PIL uses RGB; OpenCV expects BGR.
        writer.write(cv2.cvtColor(np.array(frame), cv2.COLOR_RGB2BGR))
    writer.release()

# -----------------------------------------------------------------------------
# POSTER
# -----------------------------------------------------------------------------
def make_poster(output_path, screenshots, logo):
    """Create a 4:5 social poster, good for Instagram/Facebook/X posts."""
    w, h = 1080, 1350
    poster = make_gradient_bg((w, h), 0)
    draw = ImageDraw.Draw(poster)
    draw_logo_and_brand(poster, logo, w, h, compact=True)

    # Use the results/team screenshot if available; otherwise the last screenshot.
    shot = screenshots[0][1]
    card = make_screenshot_card(shot, (880, 650))
    paste_center(poster, card, (w // 2, 760), shadow=True)

    # Header copy.
    draw_pill(draw, (72, 172), "FREE FOOTBALL DRAFT GAME", COLOURS["green"], size=22)
    headline = "Build your ultimate\n5-a-side team"
    draw_text(draw, (72, 238), headline, font(70), COLOURS["white"], shadow=True, spacing=8)
    body = "Choose a mode. Pick players. Fill GK, DEF, MID, MID and FWD. Reveal ratings and climb the leaderboard."
    wrapped = wrap_text(draw, body, font(30, False), 900)
    draw_text(draw, (72, 420), wrapped, font(30, False), COLOURS["muted"], shadow=True, spacing=8)

    # How to play boxes.
    y = 1110
    steps = [("1", "Choose"), ("2", "Pick"), ("3", "Build"), ("4", "Reveal")]
    box_w = 218
    for i, (num, title) in enumerate(steps):
        x = 72 + i * 235
        draw.rounded_rectangle((x, y, x + box_w, y + 86), radius=24, fill=(15, 23, 42, 215), outline=(96, 165, 250, 190), width=2)
        draw.ellipse((x + 18, y + 23, x + 58, y + 63), fill=COLOURS["blue"])
        draw.text((x + 38, y + 32), num, font=font(21), fill=COLOURS["white"], anchor="ma")
        draw.text((x + 72, y + 27), title, font=font(26), fill=COLOURS["white"])

    # CTA.
    draw.rounded_rectangle((72, 1230, 1008, 1302), radius=999, fill=COLOURS["blue"])
    draw.text((540, 1266), CTA_URL, font=font(38), fill=COLOURS["white"], anchor="mm")

    poster.convert("RGB").save(output_path, quality=95)

# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------
def main():
    screenshots, logo = load_assets()
    if not screenshots:
        raise RuntimeError("No screenshots found. Put screenshots in the same folder as this script.")

    out_dir = Path("/mnt/data") if Path("/mnt/data").exists() else Path(".")
    portrait = out_dir / "ultimate5aside_promo_portrait_tiktok.mp4"
    landscape = out_dir / "ultimate5aside_promo_landscape_youtube.mp4"
    poster = out_dir / "ultimate5aside_social_poster.png"

    print("Using screenshots:", [name for name, _ in screenshots])
    print("Creating portrait video...")
    write_video(portrait, (1080, 1920), screenshots, logo, "portrait")

    print("Creating landscape video...")
    write_video(landscape, (1920, 1080), screenshots, logo, "landscape")

    print("Creating poster...")
    make_poster(poster, screenshots, logo)

    print("Done")
    print(portrait)
    print(landscape)
    print(poster)

if __name__ == "__main__":
    main()
