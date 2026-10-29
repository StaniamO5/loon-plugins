/*
 * 闲鱼去开屏广告 - Loon http-response 脚本
 * 匹配：mtop.taobao.idlecommerce.splash.(ads|async.ads|config)
 * 思路：不 reject 自家开屏接口（失败会触发第三方广告联盟兜底开屏），
 *       而是递归改写响应：素材列表清空、展示次数归零、广告开关关闭。
 */

let body = $response.body;

// 素材/广告列表 → 清空
const LIST_KEY = /^(materials?|materialList|ads?|adList|adInfos?|creatives?|creativeList|splash(es|List|Ads)?|resources?|list|items|result|datas?)$/i;
// 次数、时长 → 0
const COUNT_KEY = /(maxShowCount|leftShowCount|showTimes\w*|showCount|dailyShow\w*|duration|countDown|countdown|showDuration|displayTime)/i;
// 开关 → false
const SWITCH_KEY = /(enable|enabled|switch|isOpen|open|isShow|needShow|showAd|adSwitch|splashSwitch)$/i;

function walk(node, depth) {
  if (depth > 12 || node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, depth + 1));
    return;
  }
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (Array.isArray(v) && LIST_KEY.test(k)) {
      node[k] = [];
    } else if (typeof v === "number" && COUNT_KEY.test(k)) {
      node[k] = 0;
    } else if (typeof v === "boolean" && SWITCH_KEY.test(k)) {
      node[k] = false;
    } else if (typeof v === "string" && SWITCH_KEY.test(k) && /^(true|1|on)$/i.test(v)) {
      node[k] = v === "1" ? "0" : "false";
    } else if (typeof v === "object") {
      walk(v, depth + 1);
    }
  }
}

try {
  const obj = JSON.parse(body);
  if (obj && obj.data && typeof obj.data === "object") walk(obj.data, 0);
  body = JSON.stringify(obj);
} catch (e) {
  console.log(`[闲鱼去开屏] 解析失败，原样放行：${e}`);
}

$done({ body });
