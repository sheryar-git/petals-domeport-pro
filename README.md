# Petals Domeport Pro

SAT's dome previewer, working in a web browser.

**Live:** [petals.fm/dome](https://petals.fm/dome)

```
     _
   _(_)_
  (_)@(_)
    (_)\
       |
```

[Domeport](https://github.com/sat-mtl/DomeportPro) by the Société des arts technologiques (SAT) shows dome and planetarium content the way an audience would see it. It runs on [ossia score](https://github.com/ossia/score). Its web build loaded but never drew the dome. This is the same app with the fixes it needed, and it's what runs at petals.fm/dome.

## Fixes, sent upstream

| | what was wrong | pull request |
|---|---|---|
| ossia SDK | Qt Quick 3D was left out of the web build, so the dome could not load | [ossia/sdk#49](https://github.com/ossia/sdk/pull/49) |
| Domeport | it started playback before the browser's audio engine was ready, and stopped | [sat-mtl/DomeportPro#99](https://github.com/sat-mtl/DomeportPro/pull/99) |

## Smoother video

Two small changes to score's video decoder (`fix/patches/score/`): the browser build can decode on several threads when the page asks, and it no longer sleeps 4 ms after every frame. A 2048 x 2048 dome film plays close to its full 30 frames a second, with picture and sound in step through the loop.

## What's here

- `qml/`, `score/`, `docs/`: Domeport, at [65d6a42](https://github.com/sat-mtl/DomeportPro/commit/65d6a4273962d17f475d1f8e5674ee57575ff289), with its fix applied
- `.github/workflows/wasm-quick3d.yml`: the web build
- `fix/patches/`: our changes to the ossia SDK, Domeport and score, as patches against upstream
- `fix/site/`: the two QML files petals.fm/dome serves in place of SAT's: `DomeportView.qml` (opens a film when the page loads) and `SidePanel.qml` (the menu icon, drawn without SVG)
- `ci/qtquick3d-patches/`: two Qt Quick 3D patches, copied unchanged from [ossia/sdk](https://github.com/ossia/sdk) at d393c80

Tested in Chrome (headless). Safari can't run it yet: the build needs WebAssembly JSPI.

## Credit

Domeport is by [SAT](https://sat.qc.ca). ossia score and its SDK are by the [ossia](https://ossia.io) team. Thank you both. GPL-3.0, like Domeport: see `LICENSE`. Domeport's own README is in `README-DomeportPro.md`.
