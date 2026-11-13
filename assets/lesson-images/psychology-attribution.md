# Psychology pilot diagrams

Original diagrams authored for Gnosi, 13 November 2026. Copyright Gnosi contributors.
Released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
No photographs, diagrams, icons, or text passages from the cited textbooks are reproduced.

| SVG source / PNG export | Purpose |
| --- | --- |
| `psychology-evidence` | Hypothetical observation and competing explanations; no research data |
| `psychology-attention` | Same symbols with two search goals; explicitly not an experimental attention test |
| `psychology-memory` | Encoding, storage and retrieval as interacting functions; not anatomy |

SVG sources use DejaVu Sans and the app's navy, muted teal, ivory and brass palette.
PNGs are 1200 × 720 exports for the existing native image renderer. Both cover and
inline use resolve to the same bundled PNG, without requiring remote access.
Captions provide the diagram's meaning and limits; the reader supports zoom.

Regenerate from the repository root using the existing `sharp` dependency:

```sh
node -e 'const sharp=require("sharp"); Promise.all(["evidence","attention","memory"].map(n=>sharp("assets/lesson-images/psychology-"+n+".svg").png().toFile("assets/lesson-images/psychology-"+n+".png"))).catch(e=>{console.error(e);process.exitCode=1;});'
```
