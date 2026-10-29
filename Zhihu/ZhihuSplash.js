/*
 * 知乎广告位去广告（含开屏）- Loon http-response 脚本
 * 匹配：api.zhihu.com/commercial_api/ 下的
 *   launch_v2 / real_time_launch_v2  开屏（预下载 / 实时），Tanx、京东等通过知乎 ADX 中标的广告都从这里下发
 *   sdk/prefetch                     优量汇、穿山甲 SDK 代码位配置
 *   app_float_layer                  浮层广告
 *   real_time_pull_refresh_v2        下拉刷新广告
 *   real_time_second_floor_v2        下拉“二楼”广告
 *
 * 做法：只清空 ads / sdk 两个数组，其余字段原样保留，App 得到的是正常的“本次无广告”。
 *   不 reject：返回 {} 或请求失败时，App 会沿用旧缓存或转去 SDK 兜底，在启动页等满超时（白屏）。
 * 注意：开屏响应形如 {"launch": "{\"ads\":[...]}"}，广告列表在字符串化的 JSON 里，
 *   遇到以 { 或 [ 开头的字符串字段会先解析、处理，再序列化回去。
 */

let body = $response.body;

function walk(node, depth) {
  if (depth > 10 || !node || typeof node !== "object") return;
  if (Array.isArray(node)) return node.forEach((x) => walk(x, depth + 1));
  for (const k of Object.keys(node)) {
    const v = node[k];
    if ((k === "ads" || k === "sdk") && Array.isArray(v)) {
      node[k] = [];
    } else if (typeof v === "string" && /^\s*[\[{]/.test(v)) {
      try {
        const inner = JSON.parse(v);
        walk(inner, depth + 1);
        node[k] = JSON.stringify(inner);
      } catch (_) {}
    } else if (v && typeof v === "object") {
      walk(v, depth + 1);
    }
  }
}

try {
  const obj = JSON.parse(body);
  walk(obj, 0);
  body = JSON.stringify(obj);
} catch (e) {
  // 响应为空或非 JSON 时原样放行
}

$done({ body });
