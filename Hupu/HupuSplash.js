/*
 * 虎扑开屏去广告 - Loon http-response 脚本
 * 匹配：goblin.hupu.com/…/interfaceAd/ 下除 getOther 以外的接口（开屏、下拉刷新广告）
 * 为什么不 reject：返回 {} 或请求失败时，客户端判定“广告没拿到”，
 *   会停在白色启动页等满超时（或转去请求兜底广告）才进首页。
 *   这里保留接口的成功状态码和整体结构，只把广告内容掏空，
 *   让客户端立即得出“当前无广告可展示”的结论，直接进首页。
 */

const url = $request.url;
let body = $response.body;

// 广告素材/列表 → 清空
const LIST_KEY = /^(list|ads?|adList|ad_list|adInfos?|items|materials?|creatives?|resources?|splash(List|es)?|datas?|result|banners?|imgs?|images?|videos?)$/i;
// 展示时长、次数、倒计时 → 0
const NUM_KEY = /(duration|countdown|countDown|showTime|show_time|showCount|show_count|times|skipTime|skip_time|interval|displayTime)$/i;
// 展示开关 → false/0
const SWITCH_KEY = /^(show|isShow|is_show|needShow|need_show|enable|enabled|open|isOpen|hasAd|has_ad|adSwitch|ad_switch|isAd|is_ad)$/i;
// 素材地址 → 空串（防止客户端拿到 URL 后自行下载展示）
const URL_KEY = /(img|image|pic|video|cover|url|link|src|schema|scheme|deeplink)$/i;
// 状态码类字段保持原样
const KEEP_KEY = /^(code|status|errno|err_no|error_code|errCode|msg|message|error|is_login|ts|timestamp)$/i;

function dump(u, raw) {
  try {
    const KEY = "hupu_splash_dump";
    let arr = [];
    try { arr = JSON.parse($persistentStore.read(KEY) || "[]"); } catch (_) {}
    const path = u.split("?")[0];
    arr = arr.filter((x) => x.path !== path);
    arr.unshift({ path, time: new Date().toLocaleString("zh-CN", { hour12: false }), body: raw.slice(0, 8000) });
    $persistentStore.write(JSON.stringify(arr.slice(0, 6)), KEY);
    $notification.post("虎扑开屏：已抓到响应", path.replace(/^https:\/\/goblin\.hupu\.com/, ""), "点此或在 Safari 打开 https://goblin.hupu.com/loon-dump 查看", { openUrl: "https://goblin.hupu.com/loon-dump" });
  } catch (e) {
    console.log(`[虎扑开屏] 保存失败：${e}`);
  }
}

function walk(node, depth) {
  if (depth > 12 || node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, depth + 1));
    return;
  }
  for (const k of Object.keys(node)) {
    if (KEEP_KEY.test(k)) continue;
    const v = node[k];
    if (Array.isArray(v)) {
      if (LIST_KEY.test(k)) node[k] = [];
      else walk(v, depth + 1);
    } else if (typeof v === "number" && NUM_KEY.test(k)) {
      node[k] = 0;
    } else if (SWITCH_KEY.test(k) && (typeof v === "boolean" || typeof v === "number" || /^(true|false|0|1)$/i.test(String(v)))) {
      node[k] = typeof v === "number" ? 0 : typeof v === "boolean" ? false : v === "1" || v === "0" ? "0" : "false";
    } else if (typeof v === "string" && /^https?:\/\//.test(v) && URL_KEY.test(k)) {
      node[k] = "";
    } else if (v && typeof v === "object") {
      walk(v, depth + 1);
    }
  }
}

try {
  const obj = JSON.parse(body);
  // 调试：保存原始响应，Safari 打开 https://goblin.hupu.com/loon-dump 可查看
  dump(url, body);
  walk(obj, 0);
  body = JSON.stringify(obj);
} catch (e) {
  console.log(`[虎扑开屏] 解析失败，原样放行：${e}`);
}

$done({ body });
