# Ultimate 5-a-side TikTok Video Generator - COMMENTED VERSION
# ============================================================
# This script creates a short vertical MP4 video for TikTok/Reels/Shorts.
# It uses your Ultimate 5-a-side logo, draws all graphics with Python,
# and exports the final file as: ultimate5aside_tiktok_18s.mp4
#
# HOW TO RUN ON YOUR LAPTOP
# ------------------------------------------------------------
# 1. Put this script in the same folder as your logo.
# 2. Make sure the logo is named one of:
#       Ultimate 5-a-side LOGO.png
#       Ultimate 5-a-side LOGO TRANSPARENT.png
# 3. Open PowerShell in that folder.
# 4. Run:
#       python create_tiktok_video_COMMENTED.py
#
# OUTPUT
# ------------------------------------------------------------
# The script creates:
#       ultimate5aside_tiktok_18s.mp4
#       ultimate5aside_tiktok_18s_storyboard.txt
#
# THINGS YOU WILL MOST LIKELY EDIT
# ------------------------------------------------------------
# - W, H: video size
# - FPS: frames per second
# - DUR: video length in seconds
# - OUT: output file name
# - BLUE, GREEN, WHITE, MUTED: colours
# - players: player names, years, positions, ratings, accept/decline choices
# - text inside the timeline section near the bottom

from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import numpy as np
import cv2
import os

# ============================================================
# 1. BASIC VIDEO SETTINGS
# ============================================================
# TikTok/Reels/Shorts use a vertical format. 720 x 1280 is lighter/faster.
# If you want higher quality, use W=1080 and H=1920, but rendering is slower.
W, H = 720, 1280

# Frames per second. Higher is smoother but slower/larger.
FPS = 20

# Total length in seconds. Keep under 20 seconds for your current plan.
DUR = 18

# Total number of frames to draw.
N = FPS * DUR

# Final output video file.
OUT = "ultimate5aside_tiktok_18s.mp4"

# ============================================================
# 2. LOAD THE LOGO
# ============================================================
# The script looks for your normal logo first.
logo_path = Path("Ultimate 5-a-side LOGO.png")

# If the normal logo does not exist, it tries the transparent one instead.
if not logo_path.exists():
    logo_path = Path("Ultimate 5-a-side LOGO TRANSPARENT.png")

# Open the logo as RGBA so transparency is preserved.
logo = Image.open(logo_path).convert("RGBA")

# ============================================================
# 3. FONT HANDLING
# ============================================================
# These are common font locations on Windows, Linux and Mac.
# The script tries them in order and uses the first one it finds.
FONT_BOLD_CANDIDATES = [
    r"C:/Windows/Fonts/arialbd.ttf",
    r"C:/Windows/Fonts/segoeuib.ttf",
    r"C:/Windows/Fonts/calibrib.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]

FONT_REG_CANDIDATES = [
    r"C:/Windows/Fonts/arial.ttf",
    r"C:/Windows/Fonts/segoeui.ttf",
    r"C:/Windows/Fonts/calibri.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
]


def find_font(candidates):
    """Return the first font path that exists on this computer."""
    for font_path in candidates:
        if Path(font_path).exists():
            return font_path
    return None


font_bold = find_font(FONT_BOLD_CANDIDATES)
font_reg = find_font(FONT_REG_CANDIDATES)


def F(size, bold=True):
    """Shortcut function for loading a font.

    Example:
        F(40)       = bold font, size 40
        F(26,False) = regular font, size 26
    """
    font_path = font_bold if bold else font_reg
    if font_path:
        try:
            return ImageFont.truetype(font_path, size)
        except OSError:
            pass
    return ImageFont.load_default()


# ============================================================
# 4. COLOUR SETTINGS
# ============================================================
# These match your website's dark-blue / electric-blue style.
BLUE = (37, 99, 235)
GREEN = (34, 197, 94)
WHITE = (245, 248, 255)
MUTED = (190, 205, 230)


# ============================================================
# 5. DRAWING HELPER FUNCTIONS
# ============================================================

def ease(x):
    """Smooth animation helper.

    Takes a value between 0 and 1 and makes movement feel less robotic.
    Used when the logo or card grows slightly into view.
    """
    x = max(0, min(1, x))
    return x * x * (3 - 2 * x)


def bg():
    """Create the dark blue gradient background used on every frame."""
    yy = np.linspace(0, 1, H)[:, None]
    xx = np.linspace(0, 1, W)[None, :]

    base = np.array([2, 10, 26])      # very dark navy
    blue = np.array([13, 42, 105])    # richer blue

    # Mix the two colours diagonally across the image.
    g = 0.65 * yy + 0.35 * xx
    arr = (base * (1 - g[..., None]) + blue * g[..., None]).astype(np.uint8)

    img = Image.fromarray(arr, "RGB").convert("RGBA")

    # Add soft glow circles behind the content.
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for cx, cy, r, c, a in [
        (80, 80, 280, BLUE, 95),
        (650, 300, 330, GREEN, 50),
        (360, 1160, 360, (0, 107, 255), 65),
    ]:
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*c, a))

    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(70)))
    return img


def center(d, text, y, font, fill=WHITE, stroke=0):
    """Draw centred text at vertical position y."""
    bb = d.textbbox((0, 0), text, font=font, stroke_width=stroke)
    x = (W - (bb[2] - bb[0])) / 2
    d.text(
        (x, y),
        text,
        font=font,
        fill=fill,
        stroke_width=stroke,
        stroke_fill=(0, 0, 0, 120),
    )


def rr(d, xy, r, fill, outline=None, w=1):
    """Shortcut for drawing a rounded rectangle."""
    d.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=w)


def paste_logo(img, size, y, op=255):
    """Paste the logo centred on the frame.

    size = maximum logo width/height in pixels
    y    = vertical position from top
    op   = opacity, 255 is fully visible
    """
    L = logo.copy()
    L.thumbnail((size, size), Image.LANCZOS)

    if op < 255:
        L.putalpha(L.getchannel("A").point(lambda p: int(p * op / 255)))

    img.alpha_composite(L, ((W - L.width) // 2, int(y)))


def button(d, txt, xy, col):
    """Draw a rounded button with centred text."""
    rr(d, xy, 18, (*col, 255))
    bb = d.textbbox((0, 0), txt, font=F(25))
    d.text(
        ((xy[0] + xy[2] - bb[2] + bb[0]) / 2, (xy[1] + xy[3] - bb[3] + bb[1]) / 2 - 3),
        txt,
        font=F(25),
        fill=(255, 255, 255),
    )


def pitch(img, xy, a=230):
    """Draw a simple 5-a-side football pitch."""
    x1, y1, x2, y2 = xy
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    rr(d, xy, 26, (16, 138, 67, a), (255, 255, 255, 170), 3)

    line = (255, 255, 255, 165)
    d.line((x1 + 25, (y1 + y2) // 2, x2 - 25, (y1 + y2) // 2), fill=line, width=3)
    d.ellipse(
        ((x1 + x2) // 2 - 48, (y1 + y2) // 2 - 48, (x1 + x2) // 2 + 48, (y1 + y2) // 2 + 48),
        outline=line,
        width=3,
    )
    d.rounded_rectangle((x1 + 190, y1, x2 - 190, y1 + 75), radius=14, outline=line, width=3)
    d.rounded_rectangle((x1 + 190, y2 - 75, x2 - 190, y2), radius=14, outline=line, width=3)

    img.alpha_composite(layer)


def card(img, player, year, pos, rating, accepted=None, scale=1.0):
    """Draw the player card used in the accept/decline section.

    accepted can be:
        None  = show only the card, no decision yet
        True  = show ACCEPT on the card
        False = show DECLINE on the card
    """
    w, h = 560 * scale, 255 * scale
    x = (W - w) / 2
    y = 205

    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    # Drop shadow under the card.
    d.rounded_rectangle((x + 8, y + 10, x + w + 8, y + h + 10), radius=25, fill=(0, 0, 0, 75))
    layer = layer.filter(ImageFilter.GaussianBlur(5))
    d = ImageDraw.Draw(layer)

    # Main card body.
    d.rounded_rectangle((x, y, x + w, y + h), radius=25, fill=(250, 252, 255, 245), outline=(96, 165, 250, 210), width=3)

    # Dark card header.
    d.rounded_rectangle((x, y, x + w, y + 62 * scale), radius=25, fill=(15, 23, 42, 245))

    # Text on the card.
    d.text((x + 22 * scale, y + 16 * scale), year, font=F(int(25 * scale)), fill=(147, 197, 253))
    d.text((x + w - 70 * scale, y + 16 * scale), pos, font=F(int(25 * scale)), fill=(255, 255, 255))
    d.text((x + 22 * scale, y + 92 * scale), player, font=F(int(36 * scale)), fill=(15, 23, 42))
    d.text((x + 22 * scale, y + 140 * scale), "Random nostalgia pick", font=F(int(19 * scale), False), fill=(71, 85, 105))

    # Rating pill.
    rr(d, (x + 22 * scale, y + 180 * scale, x + 120 * scale, y + 225 * scale), 12, (219, 234, 254, 255))
    d.text((x + 40 * scale, y + 188 * scale), rating, font=F(int(25 * scale)), fill=(30, 64, 175))

    # Decision pill.
    if accepted is not None:
        col = GREEN if accepted else (239, 68, 68)
        txt = "ACCEPT" if accepted else "DECLINE"
        rr(d, (x + w - 160 * scale, y + 180 * scale, x + w - 22 * scale, y + 225 * scale), 12, (*col, 255))
        d.text((x + w - 146 * scale, y + 191 * scale), txt, font=F(int(18 * scale)), fill=(255, 255, 255))

    img.alpha_composite(layer)


# ============================================================
# 6. EDITABLE PLAYER LIST
# ============================================================
# Each player is:
#   (Name, Year, Position, Rating, Accepted?)
#
# Accepted? controls whether the draft accepts or declines that player:
#   True  = accepted / locked in
#   False = declined / gambled
players = [
    ("Ronaldinho", "2005", "MID", "95", False),
    ("Cristiano Ronaldo", "2008", "FWD", "91", True),
    ("Iniesta", "2010", "MID", "90", True),
    ("Messi", "2011", "FWD", "94", True),
    ("Casillas", "2012", "GK", "89", True),
]


# ============================================================
# 7. CREATE THE VIDEO WRITER
# ============================================================
# OpenCV writes each frame into an MP4 file.
writer = cv2.VideoWriter(OUT, cv2.VideoWriter_fourcc(*"mp4v"), FPS, (W, H))


# ============================================================
# 8. MAIN VIDEO LOOP
# ============================================================
# This loop draws every frame.
# i = frame number
# t = current time in seconds
for i in range(N):
    t = i / FPS

    # Start every frame with the background.
    img = bg()
    d = ImageDraw.Draw(img)

    # --------------------------------------------------------
    # SCENE 1: Intro, 0 to 3 seconds
    # --------------------------------------------------------
    if t < 3:
        paste_logo(img, int(250 + 40 * ease(t / 1.2)), 125)
        center(d, "ULTIMATE 5-A-SIDE", 445, F(44), WHITE, 2)
        center(d, "Build your draft. Beat your mates.", 505, F(26, False), MUTED)
        center(d, "2005–2026 nostalgia challenge", 575, F(25), GREEN)

    # --------------------------------------------------------
    # SCENE 2: Game-mode style card, 3 to 5.4 seconds
    # --------------------------------------------------------
    elif t < 5.4:
        paste_logo(img, 105, 40)
        center(d, "Choose your 5-a-side challenge", 185, F(31), WHITE)

        rr(d, (72, 285, 648, 510), 24, (255, 255, 255, 240), (96, 165, 250, 170), 3)
        d.text((105, 320), "🎲 Ultimate Draft 5-a-side", font=F(29), fill=(15, 23, 42))
        d.text((105, 370), "Accept or decline random players", font=F(21, False), fill=(71, 85, 105))
        d.text((105, 415), "Can you gamble your way to the best team?", font=F(21, False), fill=(71, 85, 105))

        button(d, "START GAME", (190, 565, 530, 635), BLUE)
        center(d, "Random players. Hidden ratings. Big choices.", 720, F(23), MUTED)

    # --------------------------------------------------------
    # SCENE 3: Player reveal sequence, 5.4 to 13.8 seconds
    # --------------------------------------------------------
    elif t < 13.8:
        # Work out which player should be shown based on the current time.
        idx = min(4, int((t - 5.4) / 1.68))
        local = (t - 5.4) - idx * 1.68

        paste_logo(img, 78, 30, 225)
        center(d, "Pick player", 120, F(31), WHITE)

        player, year, pos, rating, acc = players[idx]

        # Card scales up slightly at the start of each reveal.
        card_scale = 0.93 + 0.07 * ease(min(local, 0.4) / 0.4)

        # For the first 0.8 seconds, hide the accept/decline decision.
        # After that, show whether the player was accepted or declined.
        card(img, player, year, pos, rating, None if local < 0.8 else acc, card_scale)

        if local < 0.8:
            button(d, "ACCEPT", (95, 535, 335, 605), GREEN)
            button(d, "DECLINE", (385, 535, 625, 605), (220, 38, 38))
        else:
            center(d, "LOCKED IN ✅" if acc else "GAMBLED ❌", 545, F(34), GREEN if acc else (239, 68, 68), 1)

        # Draw the draft-board pitch underneath the card.
        pitch(img, (90, 700, 630, 1120), 175)

        # Slot labels and positions on the pitch.
        slots = [("GK", .5, .88), ("DEF", .5, .68), ("MID", .32, .5), ("MID", .68, .5), ("FWD", .5, .22)]

        # Count accepted players so far and fill pitch slots accordingly.
        count = sum(1 for k, p in enumerate(players[:idx + 1]) if p[4] and (t - 5.4) > k * 1.68 + 0.9)

        for s, (lab, px, py) in enumerate(slots):
            x = 90 + px * (630 - 90)
            y = 700 + py * (1120 - 700)
            fill = (255, 255, 255, 230) if s < count else (255, 255, 255, 70)
            rr(d, (x - 52, y - 25, x + 52, y + 25), 12, fill, (255, 255, 255, 140), 2)
            d.text((x - 22, y - 15), lab, font=F(17), fill=(15, 23, 42) if s < count else (255, 255, 255, 180))

    # --------------------------------------------------------
    # SCENE 4: Final team reveal, 13.8 to 16.2 seconds
    # --------------------------------------------------------
    elif t < 16.2:
        paste_logo(img, 85, 30, 230)
        center(d, "FINAL 5-A-SIDE", 130, F(37), WHITE, 2)
        pitch(img, (80, 205, 640, 900), 230)

        team = [
            ("Casillas", "GK", .5, .88),
            ("Ronaldo", "FWD", .5, .22),
            ("Iniesta", "MID", .32, .5),
            ("Messi", "FWD", .68, .5),
            ("?", "DEF", .5, .68),
        ]

        for name, pos, px, py in team:
            x = 80 + px * (640 - 80)
            y = 205 + py * (900 - 205)
            rr(d, (x - 90, y - 29, x + 90, y + 29), 13, (255, 255, 255, 238), (147, 197, 253), 2)
            d.text((x - 77, y - 18), name, font=F(19), fill=(15, 23, 42))
            d.text((x + 48, y - 17), pos, font=F(15), fill=BLUE)

        center(d, "Can you beat this team?", 990, F(35), GREEN, 1)

    # --------------------------------------------------------
    # SCENE 5: Final call-to-action, 16.2 to 18 seconds
    # --------------------------------------------------------
    else:
        paste_logo(img, 240, 165)
        center(d, "Play the nostalgia draft", 510, F(36), WHITE, 2)
        center(d, "Ultimate5aside.app", 580, F(33), GREEN, 1)
        center(d, "Challenge your mates ⚽", 645, F(26), MUTED)
        button(d, "TRY IT NOW", (165, 740, 555, 815), BLUE)

    # Text at the bottom of every frame.
    d.text((W // 2 - 140, H - 55), "#Ultimate5ASide  #FootballDraft", font=F(18, False), fill=(180, 200, 230))

    # Convert Pillow RGB format to OpenCV BGR format, then write to video.
    frame = np.array(img.convert("RGB"))[:, :, ::-1]
    writer.write(frame)


# ============================================================
# 9. FINISH VIDEO AND WRITE STORYBOARD NOTES
# ============================================================
writer.release()

Path("ultimate5aside_tiktok_18s_storyboard.txt").write_text(
    """Ultimate 5-a-side TikTok video, 18 seconds, vertical 720x1280.

0-3s: Logo + hook.
3-5.4s: Website-style challenge selection.
5.4-13.8s: Nostalgia player picks with accept/decline.
13.8-16.2s: Final 5-a-side pitch reveal.
16.2-18s: Call to action: Ultimate5aside.app.

No audio is included, so you can add trending TikTok audio when uploading.
"""
)

print(OUT, os.path.getsize(OUT))
