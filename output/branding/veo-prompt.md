# Veo prompt — hireon hero background

## Settings
- Resolution: **1920×1080** (16:9)
- Duration: **6–8 seconds**, **seamless loop** (Veo: enable "loop" or generate longer and trim with smooth fade)
- FPS: 30 or 60
- Format: MP4 (H.264 ok; webm fallback можно перекодировать потом через ffmpeg)
- Generate **2–3 variants** of the same prompt — выберем лучший

## Master prompt (RU + EN — Veo лучше понимает английский, оставил оба)

### EN — main prompt
```
Cinematic abstract motion background. A slow-flowing ribbon of liquid plasma swirls
on the right two-thirds of the frame, drifting in a soft S-curve. The mass has a
deep indigo halo, an electric blue body, a glowing cyan core, and subtle violet
rim highlights. Background is dark space, deep navy almost black. The left third
of the frame stays mostly empty and dark for headline space. Motion is gentle,
liquid, hypnotic but not dizzying — like ink dissolving in water. No abrupt
changes, no flashes. Soft volumetric light, subtle floating particles, faint film
grain. Premium, futuristic, AI agency aesthetic. Mesmerizing slow loop.

Strict rules: NO text, NO logos, NO watermarks, NO recognizable letters or
shapes. Pure abstract.

Color palette (use precisely, in this order from background to highlight):
- #04060d  near-black background
- #0a0e2a  deep navy
- #1e1b4b  indigo
- #1d4ed8  dark electric blue
- #3b82f6  brand blue
- #22d3ee  cyan glow
- #a5f3fc  light cyan core
- #7c3aed  violet rim accent (sparingly, on the edges of the brightest crests)

Composition: mass center at roughly 70% horizontal, 50% vertical. Mass occupies
~55% of the canvas, fading to pure background by the left edge. Loop seamlessly.
```

### Variations (try each in a separate generation)

**A. Wide swirl (default — start with this)**
> use master prompt as-is

**B. Vertical column flow**
> Modify: "ribbon flows vertically as a column on the right side, slow rising
> spiral motion instead of S-curve"

**C. Multi-layer depth**
> Add: "two overlapping translucent layers of plasma at different depths, parallax
> effect, the rear layer slower and darker, the front layer faster with bright
> cyan highlights"

## Tips for Veo (Google AI Studio → Build → Video Generation)

- Если Veo генерирует слишком быстро / резко — в промпте усиливай: `"very slow",
  "8x slow motion", "barely moving"`
- Если палитра уходит в фиолетовый/розовый (Veo любит teal/magenta) — добавь:
  `"NO magenta, NO pink, strictly the listed hex colors"`
- Если появляется текст / artefacts с буквами — `"completely abstract, no symbols
  whatsoever, no characters"`
- Loop: Veo 3 умеет loop хуже Sora. Если шов виден — генери 12 сек, потом в
  ffmpeg делаем crossfade на стыке:
  ```bash
  ffmpeg -i in.mp4 -filter_complex \
    "[0:v]split=2[v1][v2];[v2]trim=start=10,setpts=PTS-STARTPTS[v2trim];\
    [v1][v2trim]xfade=transition=fade:duration=2:offset=10" \
    -c:v libx264 -crf 18 -preset slow loop.mp4
  ```

## After generation

1. Сохранить mp4 как `public/hero-bg.mp4` (1920×1080, под 5–10 MB после сжатия)
2. Сделать webm версию для лучшего сжатия:
   ```bash
   ffmpeg -i public/hero-bg.mp4 -c:v libvpx-vp9 -b:v 1.5M -crf 32 \
     -an public/hero-bg.webm
   ```
3. Сделать poster (1 кадр) для fallback:
   ```bash
   ffmpeg -i public/hero-bg.mp4 -ss 00:00:02 -frames:v 1 \
     public/hero-poster.webp
   ```
4. Положить пути в hero компонент (см. handoff для деталей интеграции).
