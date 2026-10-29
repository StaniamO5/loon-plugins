/*
 * 知乎信息流去广告 - Loon http-response 脚本
 * 匹配：推荐流 topstory/recommend、关注流 moments、问题下回答列表 questions/{id}/feeds 等
 * 做法：只删除带广告/商业推广标记的条目，正常内容原样保留
 */

let body = $response.body;

const AD_TYPE = /(advert|^ad$|^ad_|_ad$|market_card|promotion|commercial|feed_advert|ad_card)/i;

function isAd(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) return false;
  for (const k of ["type", "card_type", "cardType", "style", "biz_type", "item_type"]) {
    if (typeof o[k] === "string" && AD_TYPE.test(o[k])) return true;
  }
  if (o.adjson || o.ad_info || o.promotion_extra || o.is_ad === true || o.isAd === true) return true;
  // 嵌套一层的广告载体
  for (const k of ["common_card", "target", "card", "extra"]) {
    const c = o[k];
    if (c && typeof c === "object") {
      if (c.adjson || c.ad_info || c.promotion_extra || c.is_ad === true) return true;
      if (typeof c.type === "string" && AD_TYPE.test(c.type)) return true;
      if (c.footer && typeof c.footer.text === "string" && /^(广告|推广)/.test(c.footer.text)) return true;
    }
  }
  return false;
}

try {
  const obj = JSON.parse(body);
  let n = 0;
  for (const key of ["data", "items", "list"]) {
    if (Array.isArray(obj[key])) {
      const before = obj[key].length;
      obj[key] = obj[key].filter((x) => !isAd(x));
      n += before - obj[key].length;
    }
  }
  // 部分接口单独挂广告字段
  for (const key of ["ad_info", "adjson", "advert"]) if (key in obj) { delete obj[key]; n++; }
  body = JSON.stringify(obj);
  if (n) console.log(`[知乎信息流] ${$request.url.split("?")[0]} 移除 ${n} 条`);
} catch (e) {
  console.log(`[知乎信息流] 解析失败，原样放行：${e}`);
}

$done({ body });
