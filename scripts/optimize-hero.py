"""Compress PNGs in public/hero-hd into smaller JPEGs in public/hero-opt."""
import os
from PIL import Image

SRC = 'public/hero-hd'
DST = 'public/hero-opt'
os.makedirs(DST, exist_ok=True)

for name in sorted(os.listdir(SRC)):
    if not name.lower().endswith('.png'):
        continue
    src = os.path.join(SRC, name)
    img = Image.open(src).convert('RGB')
    # Keep close to 1600px wide max — 2x retina for ~800px display widths
    max_w = 1800
    if img.width > max_w:
        h = round(img.height * max_w / img.width)
        img = img.resize((max_w, h), Image.LANCZOS)
    out = os.path.join(DST, name.replace('.png', '.jpg'))
    img.save(out, 'JPEG', quality=82, optimize=True, progressive=True)
    print(f'{name} -> {os.path.basename(out)}  {img.size}  {os.path.getsize(out) // 1024} KB')
