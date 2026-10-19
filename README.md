# Domeport on the web, with the dome working

SAT's [Domeport](https://github.com/sat-mtl/DomeportPro) is a dome and planetarium previewer built on [ossia score](https://github.com/ossia/score). Its web build loaded but never drew the dome. This repo is the copy of Domeport we built with two fixes, and it is what runs at [petals.fm/dome](https://petals.fm/dome).

```
     _
   _(_)_
  (_)@(_)
    (_)\
       |
```

## the two fixes

1. **Qt Quick 3D was missing from the web build.** The ossia wasm SDK is configured with `-skip qtquick3d`, so the browser said `module "QtQuick3D" is not installed` and the dome never loaded. Fix: build Qt Quick 3D into the SDK. Patch: `fix/patches/0001-ossia-sdk-wasm-build-qtquick3d.patch`. PR: (link)
2. **Then it stopped on start.** Domeport starts playback as soon as it loads, and in the web build score's audio engine only starts one event-loop turn later, so score stopped with `Cannot playback without an audio engine set up`. Fix: start Domeport's controller one turn later. Patch: `fix/patches/0002-domeport-defer-initialize-for-wasm-audio.patch`, already applied in `qml/` here. PR: (link)

## what is in here

- Domeport at [65d6a42](https://github.com/sat-mtl/DomeportPro/commit/65d6a4273962d17f475d1f8e5674ee57575ff289), with fix 2 applied
- `.github/workflows/wasm-quick3d.yml`: the build. It adds Qt Quick 3D on top of the existing SDK (release sdk44) instead of rebuilding the whole SDK, then builds score v3.9.0 and packages Domeport.
- `fix/patches/`: both fixes as patches against upstream
- `fix/site/`: our page around the build. It loads a DomeMaster still or a DomeMaster video from `media.json`.
- `fix/screenshots/`: before and after, headless Chromium

## tested

- Headless Chromium with software WebGL. Stills draw on the dome. H.264 DomeMaster video plays with sound at 2048 and 4096 square.
- Not tested: Safari (the build needs WebAssembly JSPI, which Safari doesn't have), phones, the desktop apps.

## one more thing we found

In the web build, `Score.play()` straight after `Score.stop()` leaves the dome flat grey. Waiting about a second before `play()` draws fine. Domeport's image and video pickers do stop then play, so our page opens videos with that delay (`fix/site/DomeportView.qml`). We haven't found the cause in score.

## licence

GPL-3.0, same as Domeport. See `LICENSE`. Upstream README: `README-DomeportPro.md`.

Thanks to SAT and the ossia team for these tools.
