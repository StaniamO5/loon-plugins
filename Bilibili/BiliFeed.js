/*
 * 哔哩哔哩首页推荐去广告 - Loon http-response 脚本
 * 匹配：app.bilibili.com/x/v2/feed/index
 * 处理：
 *   1. 顶部横幅轮播（banner 卡）：去掉广告位条目，全部去完则整张卡移除
 *   2. 信息流里的广告卡：card_goto 以 ad 开头（ad_av / ad_web_s / ad_inline_* 等）
 *      或带 ad_info / is_ad 标记的卡片
 */

let body = $response.body;

function isAdBanner(b) {
  if (!b || typeof b !== "object") return false;
  if (b.type === "ad") return true;
  const inner = b.static_banner || b.inline_banner || b.ad_banner || b;
  return !!(inner && (inner.is_ad === true || inner.is_ad_loc === true || inner.cm_mark === 1 || inner.ad_cb));
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

  if (Array.isArray(items)) {
    obj.data.items = items.filter((it) => {
      if (isAdCard(it)) return false;
      // 横幅轮播卡
      if (Array.isArray(it.banner_item)) {
        it.banner_item = it.banner_item.filter((b) => !isAdBanner(b));
        if (it.banner_item.length === 0) return false;
      }
      return true;
    });
  }

  body = JSON.stringify(obj);
} catch (e) {
  console.log(`[B站首页去广告] 解析失败，原样放行：${e}`);
}

$done({ body });
