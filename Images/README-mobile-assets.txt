BK25 DIGITAL – MOBILE PROJECT ASSETS

Format
- 1080 × 1620 Pixel
- Seitenverhältnis 2:3
- WebP, für Next.js Image geeignet

Dateien
- bk25-nahwerk-startseite-mobile.webp
- bk25-nahwerk-leistungen-mobile.webp
- bk25-nahwerk-karriere-mobile.webp
- bk25-wellenweg-startseite-mobile.webp
- bk25-wellenweg-leistungen-mobile.webp

Empfohlener Zielordner im Projekt
public/images/projects/mobile/

Wichtig für die Integration
- Desktop verwendet weiterhin die vorhandenen 1600 × 1000 Bilder.
- Nur ProjectSnapStage/SnapImagePanel unterhalb des vorhandenen 1100-px-Breakpoints verwendet diese Mobile-Dateien.
- ProjectStoryFrame erhält dafür ein separates optionales Feld mobileSrc.
- Der mobile scharfe Bildcontainer muss von 16:10 auf 2:3 umgestellt werden.
- Das scharfe Bild bleibt object-fit: contain.
- Die atmosphärische Hintergrundkopie darf dieselbe Mobile-Datei mit object-fit: cover verwenden.
- Stack-/Reduced-Motion-Fallback und Desktop-Slash dürfen nicht verändert werden.
