/*
 * 虎扑广告位去广告（含开屏）- Loon http-response 脚本
 * 匹配：goblin.hupu.com/…/interfaceAd/（getOther/v3、getOther/batch 等）
 *
 * 虎扑的开屏不在冷启动时请求，而是 App 回到前台/使用中通过
 *   interfaceAd/getOther/v3（ad_page_id=boot，request_source=hot_start_preload）
 * 预加载并缓存到本地，下次启动直接按缓存里的指令调用汇川/穿山甲等 SDK 拉广告。
 * 信息流广告（ad_page_id=home.recommend.topic 等）也走同一个接口。
 *
 * 不能 reject：返回 {} 或失败时，客户端解析不出“无广告”，会沿用旧缓存或走默认 SDK，
 *   在启动页等满超时（白屏）。这里保留 request_id / ad_code 等结构，只把 ads 清空，
 *   客户端缓存下来的就是“该广告位无广告”，下次启动直接进首页。
 */

let body = $response.body;

try {
  const obj = JSON.parse(body);
  let n = 0;
  (function walk(node, depth) {
    if (depth > 8 || !node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach((x) => walk(x, depth + 1));
    for (const k of Object.keys(node)) {
      if (/^(ads|ad_list|adList|list)$/.test(k) && Array.isArray(node[k])) {
        n += node[k].length;
        node[k] = [];
      } else if (node[k] && typeof node[k] === "object") {
        walk(node[k], depth + 1);
      }
    }
  })(obj, 0);
  body = JSON.stringify(obj);
  if (n) console.log(`[虎扑去广告] ${$request.url.split("?")[0]} 清空 ${n} 条广告`);
} catch (e) {
  console.log(`[虎扑去广告] 解析失败，原样放行：${e}`);
}

$done({ body });
