/*
 * 知乎广告位去广告（含开屏）- Loon http-response 脚本
 * 匹配：api.zhihu.com/commercial_api/ 下的
 *   sdk/prefetch                 广告 SDK 预取配置：下发优量汇（dsp 1054）、穿山甲（dsp 1053）
 *                                的 app_id / 代码位，App 缓存后下次冷启动直接调 SDK 拉开屏（摇一摇广告来源）
 *   launch_v2 / real_time_launch_v2   自家开屏（预下载 / 实时）
 *   app_float_layer              浮层广告
 *   real_time_pull_refresh_v2    下拉刷新广告
 *   real_time_second_floor_v2    下拉“二楼”广告
 * 不 reject：返回 {} 或失败时，App 会沿用旧缓存或转去穿山甲/优量汇兜底，
 *   在启动页等满超时（白屏）。这里保留结构，只把广告内容掏空，
 *   让 App 正常得出“这次没有开屏”的结论。
 */

let body = $response.body;


// 广告/素材列表 → 清空
const LIST_KEY = /^(sdk|sdks|sdk_list|launch_ads|launchAds|ads|ad_list|adList|data|list|items|creatives?|materials?|resources?|splash(es|_list)?)$/i;
// 时长、次数、倒计时 → 0
const NUM_KEY = /(duration|countdown|count_down|show_time|showTime|show_count|showCount|max_show|daily_show|display_time|timeout|wait_time)$/i;
// 展示开关 → false
const SWITCH_KEY = /^(show|is_show|need_show|enable|enabled|open|has_ad|ad_switch|is_ad_show|show_ad)$/i;
// 状态字段保持原样
const KEEP_KEY = /^(code|status|error|errcode|message|msg|success|paging)$/i;

function walk(node, depth) {
  if (depth > 10 || !node || typeof node !== "object") return;
  if (Array.isArray(node)) return node.forEach((x) => walk(x, depth + 1));
  for (const k of Object.keys(node)) {
    if (KEEP_KEY.test(k)) continue;
    const v = node[k];
    if (Array.isArray(v)) {
      if (LIST_KEY.test(k)) node[k] = [];
      else walk(v, depth + 1);
    } else if (typeof v === "number" && NUM_KEY.test(k)) {
      node[k] = 0;
    } else if (typeof v === "boolean" && SWITCH_KEY.test(k)) {
      node[k] = false;
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
  // 响应为空或非 JSON 时原样放行，避免制造“请求异常”
  console.log(`[知乎开屏] 非 JSON，原样放行：${e}`);
}

$done({ body });
