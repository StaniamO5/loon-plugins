/*
 * 哔哩哔哩首页推荐去广告 - Loon http-response 脚本
 * 匹配：app.bilibili.com/x/v2/feed/index
 * 处理：
 *   1. 顶部横幅（banner 卡）：静态图、内嵌视频（inline_av / ad_inline_*）等广告条目，
 *      深度检查每个条目里的广告标记；全是广告则整张卡移除
 *   2. 信息流广告卡：card_goto/goto 以 ad 开头，或卡片任意层级带广告标记
 */

let body = $response.body;

// 在对象任意层级（限深）找广告标记
function hasAdMark(o, depth) {
  if (!o || typeof o !== "object" || depth > 5) return false;
  if (Array.isArray(o)) return o.some((x) => hasAdMark(x, depth + 1));
  for (const k of Object.keys(o)) {
    const v = o[k];
    if ((k === "is_ad" || k === "is_ad_loc" || k === "isAd") && (v === true || v === 1)) return true;
    if (k === "cm_mark" && v && v !== 0) return true;
    if ((k === "ad_cb" || k === "creative_id" || k === "src_id_ad") && v && v !== "0" && v !== 0) return true;
    if ((k === "ad_info" || k === "cm_info" || k === "ad_content") && v && typeof v === "object" && Object.keys(v).length) return true;
    if ((k === "type" || k === "card_goto" || k === "goto" || k === "card_type") && typeof v === "string" && /^ad($|_)|_ad$|^cm_/.test(v)) return true;
    if ((k === "badge" || k === "ad_badge" || k === "corner_mark_text") && typeof v === "string" && /^(广告|推广)$/.test(v)) return true;
    if (v && typeof v === "object" && hasAdMark(v, depth + 1)) return true;
  }
  return false;
}

function isAdCard(it) {
  if (!it || typeof it !== "object") return false;
  const goto = String(it.card_goto || it.goto || "");
  if (/^ad/.test(goto) || goto === "cm") return true;
  if (it.ad_info || it.is_ad === true) return true;
  return false;
}

try {
  const obj = JSON.parse(body);
  const items = obj && obj.data && obj.data.items;
  let n = 0;

  if (Array.isArray(items)) {
    obj.data.items = items.filter((it) => {
      // 横幅卡：逐条检查，留下非广告条目
      if (Array.isArray(it.banner_item)) {
        const before = it.banner_item.length;
        it.banner_item = it.banner_item.filter((b) => !hasAdMark(b, 0));
        n += before - it.banner_item.length;
        if (it.banner_item.length === 0) return false;
        return true;
      }
      if (isAdCard(it) || hasAdMark(it, 0)) {
        n++;
        return false;
      }
      return true;
    });
  }

  body = JSON.stringify(obj);
  if (n) console.log(`[B站首页去广告] 移除 ${n} 条`);
} catch (e) {
  console.log(`[B站首页去广告] 解析失败，原样放行：${e}`);
}

$done({ body });
