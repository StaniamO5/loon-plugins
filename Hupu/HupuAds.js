/*
 * 虎扑去广告 - Loon http-response 脚本
 * 匹配：首页/步行街信息流（bbsallapi/lego/data）、热榜（buffer/hotList）、
 *       轮播（mang/preview/banners、getLocationBanners）、我的页（bplapi/user/v1/more）
 * 思路：虎扑各接口结构不统一，这里递归遍历响应中的所有数组，
 *       删除带广告标记的元素；正常内容原样保留。
 */

let body = $response.body;

// 字段名本身就说明是广告
const AD_KEY = /^(isAd|is_ad|ad|adInfo|ad_info|adData|ad_data|adx|adxInfo|dspInfo|dsp|admaster|adCode|ad_code|adId|ad_id|pmpInfo)$/i;
// 类型字段的取值说明是广告
const TYPE_KEY = /^(type|cardType|card_type|itemType|item_type|template|templateType|style|bizType|biz_type|showType|contentType|resourceType|moduleType|module_type)$/i;
const AD_TYPE_VAL = /(^ad$|^ads?_|_ads?$|advert|commercial|promotion|^spread|^dsp|^pmp|^cpm|^cpc|tuiguang|推广|广告)/i;

function truthy(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return v !== "" && v !== "0" && v.toLowerCase() !== "false";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return false;
}

function isAd(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) return false;
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (AD_KEY.test(k) && truthy(v)) return true;
    if (TYPE_KEY.test(k) && typeof v === "string" && AD_TYPE_VAL.test(v)) return true;
  }
  // 常见的“广告”角标
  for (const k of ["tag", "label", "cornerMark", "corner_mark", "badge", "mark", "tagText", "adTag"]) {
    const v = o[k];
    if (typeof v === "string" && /^(广告|推广|赞助)$/.test(v.trim())) return true;
    if (v && typeof v === "object" && typeof v.text === "string" && /^(广告|推广|赞助)$/.test(v.text.trim())) return true;
  }
  return false;
}

let removed = 0;
function walk(node, depth) {
  if (depth > 15 || node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (let i = node.length - 1; i >= 0; i--) {
      if (isAd(node[i])) {
        node.splice(i, 1);
        removed++;
      } else {
        walk(node[i], depth + 1);
      }
    }
    return;
  }
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (v && typeof v === "object") {
      // 单独挂在对象上的广告字段（非数组），直接删掉
      if (!Array.isArray(v) && AD_KEY.test(k)) {
        delete node[k];
        removed++;
      } else {
        walk(v, depth + 1);
      }
    }
  }
}

try {
  const obj = JSON.parse(body);
  walk(obj, 0);
  body = JSON.stringify(obj);
  if (removed) console.log(`[虎扑去广告] ${$request.url.split("?")[0]} 移除 ${removed} 处`);
} catch (e) {
  console.log(`[虎扑去广告] 解析失败，原样放行：${e}`);
}

$done({ body });
