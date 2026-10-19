// Frame pacing and A/V offset for the dome video, in headless Chromium.
//
// Picture: every large WebGL texture upload is a decoded video frame reaching
// the GPU. We log its time and the mean of a sample of its bytes, so the white
// frame the test film carries at each whole second stands out.
// Sound: an analyser taps whatever reaches the audio destination. The test
// film beeps (1 kHz, 40 ms) at each whole second; we log each beep's onset,
// mapped to performance time with getOutputTimestamp().
//
// GL=metal (default) renders on the Mac's GPU, headless; GL=sw uses SwiftShader.
// usage: URL=... DUR=240 node measure.mjs out.json
import playwright from 'playwright';  // npm i playwright
import fs from 'node:fs';

const out = process.argv[2];
const DUR = Number(process.env.DUR || 240) * 1000;
const b = await playwright.chromium.launch({ headless: true, args: [...((process.env.GL || 'metal') === 'metal' ? ['--use-angle=metal', '--enable-gpu'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']), '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => {
  const up = window.__uploads = [];
  const beeps = window.__beeps = [];
  const hook = (proto, name) => {
    const orig = proto[name];
    proto[name] = function (...args) {
      const v = args.find(a => a && ArrayBuffer.isView(a));
      if (v && v.byteLength >= 1e6) {
        const bytes = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
        let s = 0; const step = Math.floor(bytes.length / 2000);
        for (let i = 0; i < 2000; i++) s += bytes[i * step];
        up.push([performance.now(), v.byteLength, s / 2000]);
      }
      return orig.apply(this, args);
    };
  };
  hook(WebGL2RenderingContext.prototype, 'texSubImage2D');
  hook(WebGL2RenderingContext.prototype, 'texImage2D');

  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dst, ...rest) {
    if (dst instanceof AudioDestinationNode && !this.context.__an) {
      const an = this.context.createAnalyser(); an.fftSize = 8192;
      connect.call(this, an); this.context.__an = an;
      const buf = new Float32Array(an.fftSize); const sr = this.context.sampleRate;
      let last = -1e9;
      setInterval(() => {
        an.getFloatTimeDomainData(buf);
        const ts = this.context.getOutputTimestamp();
        const now = this.context.currentTime;
        for (let i = 1; i < buf.length; i++) {
          if (Math.abs(buf[i]) > 0.2 && Math.abs(buf[i - 1]) <= 0.2) {
            const onsetCtx = now - (buf.length - i) / sr;
            const perf = ts.performanceTime + (onsetCtx - ts.contextTime) * 1000;
            if (perf - last > 500) { beeps.push(perf); last = perf; }
            break;
          }
        }
      }, 20);
    }
    return connect.call(this, dst, ...rest);
  };
});
const page = await ctx.newPage();
const log = [];
page.on('console', m => { const t = m.text(); if (/decoder|thread|error|abort/i.test(t) && !/GPU stall|SidePanel|INVALID_ENUM/.test(t)) log.push(t.slice(0, 200)); });
page.on('pageerror', e => log.push('pageerror ' + e.message));
await page.goto(process.env.URL);
await page.waitForTimeout(DUR);
const data = await page.evaluate(() => ({ uploads: window.__uploads, beeps: window.__beeps }));
fs.writeFileSync(out, JSON.stringify({ ...data, log }));
console.log(`uploads ${data.uploads.length}, beeps ${data.beeps.length}`);
console.log(log.slice(0, 12).join('\n'));
await b.close();
