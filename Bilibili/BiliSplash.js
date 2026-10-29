/*
 * 哔哩哔哩去开屏广告 - Loon http-response 脚本
 * 匹配：app.bilibili.com/x/v2/splash/(list|show|brand/list|event/list2)
 * 思路：不直接 reject（会导致 App 反复重试或白屏等待），而是返回结构合法但内容为空的 JSON，
 *       同时把展示时长归零、拉取间隔拉长，让客户端认为“当前没有可展示的开屏”。
 */

const url = $request.url;
let body = $response.body;

// 一年（秒），用于拉长拉取/展示间隔
const LONG = 365 * 24 * 3600;


try {
  const obj = JSON.parse(body);
  const d = obj && obj.data;

  if (d && typeof d === "object") {
    if (/\/splash\/list/.test(url)) {
      // 预下载的开屏素材列表
      d.max_time = 0;
      d.min_interval = LONG;
      d.pull_interval = LONG;
      d.list = [];
      if ("show" in d) d.show = [];
      if ("keep_ids" in d) d.keep_ids = [];
    } else if (/\/splash\/show/.test(url)) {
      // 本次启动实际展示哪条开屏
      d.max_time = 0;
      d.min_interval = LONG;
      d.pull_interval = LONG;
      if ("show" in d) d.show = [];
      if ("list" in d) d.list = [];
      if ("keep_ids" in d) d.keep_ids = [];
    } else if (/\/splash\/brand\/list/.test(url)) {
      // 品牌开屏（“选择你的开屏画面”）
      if ("list" in d) d.list = [];
      if ("show" in d) d.show = [];
      d.pull_interval = LONG;
    } else if (/\/splash\/event\/list2/.test(url)) {
      // 活动开屏
      d.list = [];
      if ("show" in d) d.show = [];
      d.pull_interval = LONG;
    }
  }

  body = JSON.stringify(obj);
} catch (e) {
  console.log(`[B站开屏去广告] 解析失败，原样放行：${e}`);
}

$done({ body });
