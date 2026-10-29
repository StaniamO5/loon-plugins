/*
 * 虎扑开屏调试页 - Loon http-request 脚本
 * 在 Safari 打开 https://goblin.hupu.com/loon-dump 查看 HupuSplash.js 保存的原始响应
 * 打开 https://goblin.hupu.com/loon-dump?clear=1 清空记录
 */
const KEY = "hupu_splash_dump";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

if (/[?&]clear=1/.test($request.url)) $persistentStore.write("[]", KEY);

let arr = [];
try { arr = JSON.parse($persistentStore.read(KEY) || "[]"); } catch (_) {}

function pretty(b) {
  try { return JSON.stringify(JSON.parse(b), null, 2); } catch (_) { return b; }
}

const blocks = arr.length
  ? arr.map((x, i) => `<h3>#${i + 1} ${esc(x.path.replace(/^https:\/\//, ""))}</h3>
<p class="t">${esc(x.time)}</p>
<button onclick="navigator.clipboard.writeText(document.getElementById('b${i}').innerText).then(()=>this.textContent='已复制')">复制这条</button>
<pre id="b${i}">${esc(pretty(x.body))}</pre>`).join("")
  : "<p>还没有记录。冷启动一次虎扑后刷新本页。</p>";

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>虎扑开屏抓包</title>
<style>body{font:15px -apple-system,sans-serif;margin:16px;color:#222;background:#fff}
@media(prefers-color-scheme:dark){body{color:#ddd;background:#111}pre{background:#1d1d1d!important}}
pre{white-space:pre-wrap;word-break:break-all;background:#f4f4f4;padding:10px;border-radius:8px;font-size:12px}
h3{margin:20px 0 2px;font-size:15px;word-break:break-all}.t{color:#888;margin:0 0 6px;font-size:12px}
button{padding:6px 12px;border-radius:6px;border:1px solid #888;background:none;color:inherit}</style></head>
<body><h2>虎扑抓包（${arr.length} 条，最新在前）</h2>
<p><a href="?clear=1">清空记录</a> · <button onclick="navigator.clipboard.writeText(document.getElementById('all').innerText).then(()=>this.textContent='已复制')">复制全部路径</button></p>
<pre id="all">${esc(arr.map((x) => x.time + "  " + x.path.replace(/^https:\/\//, "")).join("\n"))}</pre>${blocks}</body></html>`;

$done({ response: { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }, body: html } });
