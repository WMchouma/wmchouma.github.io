# V2 Asset Selection

Checked 2026-11-10. Only the user's supplied resource list was considered for decorative assets.

## Inspection Before Implementation

| User-listed resource | Inspection | Decision |
| --- | --- | --- |
| Frutiger Aero Archive /wallpapers | Archive states copyright applies and files are preserved for archival/personal use; commercial rights belong to original licensors | Reference only, no pack or wallpaper copied |
| Honourism /wallpapers.html | Wallpapers have original-source credits; footer reserves copyright | No artwork adopted |
| frutiger-aero.org /icons | Download collections include original OS imagery; no universal website redistribution license verified | No OS icons copied |
| Make Aero | Wallpaper, Orb, Window Glass and Button inspected; GitHub license endpoint confirms MIT for Visnalize/makeaero | Selected for all V2 decorative assets and materials |

No claim is made that all 22 supplied sites were exhaustively inspected. Selection was completed before implementing the second version.

## Adopted

| File / material | Origin | Parameters / changes | Placement |
| --- | --- | --- | --- |
| assets/cloud-sky.webp | https://makeaero.com/wallpaper | Clear Sky / Sky Blue, 6 bubbles, 0 bokeh, 6 clouds, Light Rays off, Vignette off; canvas exported at 1920 x 1080 WebP quality .90; 28,340 bytes | Shared backdrop, homepage and photography heading |
| assets/underwater.webp | https://makeaero.com/wallpaper | Underwater / Ocean Teal, 3 bubbles, 0 bokeh, God Rays on, Vignette off; 1200 x 675 WebP .88; 16,826 bytes; reused existing export from the same approved source | Music heading |
| CSS orbs | https://makeaero.com/orb | Glossy radial fill, specular ellipse, inner depth and shadows; adapted to blue/green navigation controls | Brand, tabs, home navigation |
| CSS frame | https://makeaero.com/window-glass | Colored glass sheet, diagonal reflection, top highlight, blur/saturation, inner border; simplified without fake window controls | Shared window |
| CSS buttons | https://makeaero.com/button | Gloss separation, inset highlight and hover; blue and lime green | Actions / playback links |

Procedural generator exports are bitmap assets, not AI-generated images. No screenshots of third-party artwork were used as replacement assets.

Code license: MIT, Copyright (c) 2025 Visnalize.
Repository: https://github.com/Visnalize/makeaero
Source files: app/orb/orb-client.tsx, app/wallpaper/wallpaper-client.tsx, app/window-glass/window-glass-client.tsx, app/button/button-client.tsx.
Complete notice is preserved in vendor/MAKE-AERO-LICENSE.md. CSS includes attribution.

No Unsplash, StockSnap, Wikimedia, external icon pack or remote font is used by V2. Symbols are system-font text; layout and CSS belong to the implementation. All decoration loads locally. Two shared WebP textures total 45,166 bytes.

## Existing Personal Content

content.js is an independent copy of V1's 48-track metadata, with official listening links. assets/music/zhuizhu-ahang.mp4 is copied byte for byte from the existing user-provided file (6,974,100 bytes); it is content, not sourced decoration. No additional audio, album covers, photographs or personal details were added.
