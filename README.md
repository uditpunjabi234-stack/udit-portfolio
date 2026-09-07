# Udit Punjabi — portfolio

An animated single-page portfolio. AI systems, automation, and AI film.

**Live:** https://uditpunjabi234-stack.github.io/udit-portfolio/

## What's in it

| Section | Contents |
|---|---|
| Hero | Three.js carousel of real project reels as 3D video planes, on a camera-feed frame with a live Mumbai timecode |
| About | Portrait with scroll parallax, animated counters |
| Services | Six cards with cursor-tracked glow, 3D tilt, and self-drawing SVG icons |
| Work | 12 projects on a horizontally-pinned rail, with live site screenshots and animated UI mockups |
| AI film | Five clips that play on hover and open with sound on click |
| Stack | Three velocity-reactive marquees |
| Experience | Timeline with scroll-drawn rules |
| Contact | Split-character headline, click-to-copy email, WhatsApp |

## Running it

No build step. Any static server works:

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173

## Stack

Plain HTML, CSS and JavaScript. GSAP with ScrollTrigger for animation, Lenis for smooth scroll, SplitType for character and word splitting, Three.js for the hero and the wireframe tower. All four load from CDN, so there are no dependencies to install.

Type is Bricolage Grotesque for display, Instrument Sans for body, JetBrains Mono for the camera-feed labels.

## Debug flags

Append to the URL when you need them:

- `?nogl` skips both WebGL scenes
- `?review` unpins the work rail so the whole page captures in one screenshot

## Notes

Videos are re-encoded to 720p H.264 with `faststart`, so the whole `assets/` directory is about 14MB. Reduced-motion is respected: the preloader is skipped, animations are disabled, and all content renders statically. Layout is tested down to 390px wide.
