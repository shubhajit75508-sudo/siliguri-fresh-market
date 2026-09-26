/**
 * Renders the admin theme preview in headless Chrome and prints the computed
 * styles the design depends on, plus WCAG contrast ratios for the key pairs.
 * Requires a completed `next build` (it reads the emitted CSS chunks).
 *
 *   node scripts/audit-admin-theme.cjs           # desktop 1440x1000
 *   node scripts/audit-admin-theme.cjs 390 844   # iPhone-ish
 */
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const WS = require(path.join(process.cwd(), "node_modules/next/dist/compiled/ws"));

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333;
const CHUNKS = path.join(process.cwd(), ".next/static/chunks");
const PREVIEW = path.join(CHUNKS, "__admin_theme_preview.html");

/** Picks the stylesheet holding the theme scope and the main Tailwind bundle. */
function linkStyles() {
  const files = fs.readdirSync(CHUNKS).filter((f) => f.endsWith(".css"));
  let theme = null;
  let main = null;
  for (const f of files) {
    const css = fs.readFileSync(path.join(CHUNKS, f), "utf8");
    if (css.includes(".adm-panel") && css.includes(".admin-theme")) theme = f;
    else if (!main || css.length > main.size) main = { f, size: css.length };
  }
  if (!theme) throw new Error("theme CSS chunk not found - run `next build` first");
  if (!main) throw new Error("main CSS chunk not found - run `next build` first");
  return { theme, main: main.f };
}

function buildPreview() {
  const { theme, main } = linkStyles();
  const html = fs
    .readFileSync(path.join(__dirname, "admin-theme-preview.html"), "utf8")
    .replace("<!--MAIN_CSS-->", `<link rel="stylesheet" href="${main}" />`)
    .replace("<!--THEME_CSS-->", `<link rel="stylesheet" href="${theme}" />`);
  fs.writeFileSync(PREVIEW, html);
  return { theme, main, url: "file:///" + PREVIEW.replace(/\\/g, "/") };
}

const AUDIT = `(() => {
  const g = (el, p) => (el ? getComputedStyle(el)[p] : "NO-ELEMENT");
  const out = [];
  const q = (s) => document.querySelector(s);

  // Chrome serialises oklch/lab/color-mix as lab()/oklab(), so let the browser
  // normalise any CSS colour to sRGB instead of parsing the string.
  const cv = document.createElement("canvas").getContext("2d");
  const toRGBA = (css) => {
    if (!css) return null;
    cv.clearRect(0, 0, 1, 1);
    cv.fillStyle = "rgba(1,2,3,0.5)";
    cv.fillStyle = css;
    cv.fillRect(0, 0, 1, 1);
    const d = cv.getImageData(0, 0, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
  };
  const css = (c) => "rgba(" + Math.round(c.r) + "," + Math.round(c.g) + "," + Math.round(c.b) + "," + c.a + ")";
  const opaque = (c) => "rgb(" + Math.round(c.r) + "," + Math.round(c.g) + "," + Math.round(c.b) + ")";
  const WHITE = { r: 255, g: 255, b: 255, a: 1 };

  const lum = (c) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => {
    if (!a || !b) return null;
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  /** Flattens a possibly-translucent colour onto an opaque backdrop. */
  const over = (fg, bg) => {
    if (!fg) return bg;
    if (fg.a >= 1) return fg;
    return {
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    };
  };
  /** Resolves the colour actually painted behind an element. */
  const backdrop = (el) => {
    const layers = [];
    let e = el;
    while (e) {
      const cs = getComputedStyle(e);
      // A gradient paints a background too; take its first stop as the layer.
      const img = cs.backgroundImage;
      if (img && img !== "none" && /gradient/.test(img)) {
        const stops = img.match(/(?:rgba?|lab|oklab|oklch|color)\\([^)]*\\)/g);
        const first = stops && stops.length ? toRGBA(stops[0]) : null;
        if (first && first.a > 0) layers.push(first);
      }
      const c = toRGBA(cs.backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 1) break;
      }
      e = e.parentElement;
    }
    let acc = WHITE;
    for (let i = layers.length - 1; i >= 0; i--) acc = over(layers[i], acc);
    return acc;
  };
  const style = (label, sel, prop) => {
    const el = q(sel);
    let v = el ? getComputedStyle(el)[prop] : "NO-ELEMENT";
    // report colors in plain sRGB so the log is readable
    if (typeof v === "string" && /color/i.test(prop) && v !== "NO-ELEMENT") {
      const c = toRGBA(v);
      if (c) v = prop === "backgroundColor" || /Image/.test(prop) ? v : opaque(c);
    }
    out.push(["STYLE", label, prop, v]);
  };
  const contrast = (label, fgSel, bgSel) => {
    const f = q(fgSel), b = q(bgSel);
    if (!f || !b) return out.push(["CONTRAST", label, "MISSING", fgSel]);
    const fc = toRGBA(getComputedStyle(f).color), bc = backdrop(b);
    const r = ratio(fc, bc);
    out.push(["CONTRAST", label, r === null ? "n/a" : r.toFixed(2), "fg=" + opaque(fc) + " bg=" + opaque(bc)]);
  };

  style("body", "body", "backgroundColor");
  style("root", ".adm-root", "backgroundColor");
  style("sidebar", ".adm-root aside", "backgroundColor");
  style("activeNavColor", '.adm-nav-link[data-active="true"]', "color");
  style("activeNavBg", '.adm-nav-link[data-active="true"]', "backgroundImage");
  style("idleNav", '.adm-nav-link:not([data-active="true"])', "color");
  style("panel", ".adm-panel", "backgroundColor");
  style("panelBorder", ".adm-panel", "borderTopColor");
  style("eyebrow", ".adm-eyebrow", "color");
  style("kpiValue", ".adm-panel .adm-num", "color");
  style("mutedLabel", ".adm-panel p.relative", "color");
  style("mutedLight", ".text-muted-light", "color");
  style("bgSurfaceCard", ".bg-surface", "backgroundColor");
  style("bgWhiteCard", ".bg-white", "backgroundColor");
  style("storeGreenText", '[class*="2D7D3A"]', "color");
  style("whatsapp", '[class*="25D366"]', "color");
  style("greenChip", ".bg-green-100", "backgroundColor");
  style("redTint", ".bg-red-50", "backgroundColor");
  style("tableHead", ".adm-panel thead tr", "backgroundColor");
  style("tfoot", ".adm-panel tfoot", "borderTopColor");
  style("input", ".adm-panel input", "backgroundColor");
  style("liveDot", ".adm-live", "backgroundColor");
  style("panelImage", ".adm-panel", "backgroundImage");
  style("tabbar", ".adm-tabbar", "display");
  style("tabbarIdle", '.adm-tabbar-link:not([data-active="true"])', "color");
  style("tabbarActive", '.adm-tabbar-link[data-active="true"]', "color");
  style("mainPadBottom", ".adm-main", "paddingBottom");
  style("sidebarTransform", ".adm-root aside", "transform");
  style("rowDisplay", ".adm-panel tbody tr", "display");
  style("tdDisplay", ".adm-panel tbody td", "display");
  style("cellLabel", ".adm-panel td span", "fontSize");
  out.push(["VIEWPORT", "width", String(window.innerWidth), String(window.innerHeight)]);

  contrast("kpi value on panel", ".adm-panel .adm-num", ".adm-panel");
  contrast("muted label on panel", ".adm-panel p.relative", ".adm-panel");
  contrast("active nav on sidebar", '.adm-nav-link[data-active="true"]', ".adm-root aside");
  contrast("idle nav on sidebar", '.adm-nav-link:not([data-active="true"])', ".adm-root aside");
  contrast("table head th", ".adm-panel thead th", ".adm-panel thead tr");
  contrast("green chip", ".bg-green-100", ".bg-green-100");
  contrast("eyebrow on sidebar", ".adm-eyebrow", ".adm-root aside");

  return JSON.stringify(out);
})()`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(p) {
  const res = await fetch(`http://127.0.0.1:${PORT}${p}`);
  return res.json();
}

const WIDTH = Number(process.argv[2] || 1440);
const HEIGHT = Number(process.argv[3] || 1000);

(async () => {
  const { theme, main, url } = buildPreview();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "adm-audit-"));
  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
    `--window-size=${WIDTH},${HEIGHT}`,
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: "ignore" });

  let target = null;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(250);
    try { const list = await getJSON("/json/list"); target = list.find((t) => t.type === "page"); } catch {}
  }
  if (!target) { console.error("could not reach Chrome"); chrome.kill(); process.exit(1); }

  const ws = new WS(target.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) =>
    new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });

  await new Promise((r) => ws.on("open", r));
  ws.on("message", (m) => {
    const msg = JSON.parse(m.toString());
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
  });

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: WIDTH < 768,
  });
  await send("Page.navigate", { url });
  await sleep(2500);

  const res = await send("Runtime.evaluate", { expression: AUDIT, returnByValue: true });
  const rows = JSON.parse(res.result.value);
  ws.close();
  chrome.kill();
  try { fs.unlinkSync(PREVIEW); } catch {}

  const pad = (s, n) => String(s).padEnd(n);
  console.log("");
  console.log(`viewport ${WIDTH}x${HEIGHT}  |  main=${main}  theme=${theme}`);
  console.log(pad("KIND", 10) + pad("LABEL", 24) + pad("PROP / RATIO", 22) + "VALUE");
  console.log("-".repeat(110));
  let bad = 0;
  for (const [kind, label, prop, value] of rows) {
    if (kind === "CONTRAST") {
      const r = parseFloat(prop);
      const flag = r >= 4.5 ? "PASS" : r >= 3 ? "large-only" : "FAIL";
      if (r < 3) bad++;
      console.log(pad(kind, 10) + pad(label, 24) + pad(prop + " " + flag, 22) + value);
    } else {
      console.log(pad(kind, 10) + pad(label, 24) + pad(prop, 22) + value);
    }
  }
  console.log("-".repeat(110));
  console.log(bad === 0 ? "No contrast failures." : `${bad} contrast failure(s).`);
})();
