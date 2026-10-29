/*
 * 【临时调试】知乎抓包记录 - Loon http-response 脚本
 * 只记录原始响应、不改写；Safari 打开 https://api.zhihu.com/loon-dump 查看
 * 被 ZhihuSplash.js 处理的开屏接口，也会在改写前调用同样的记录逻辑
 */
(function () {
  try {
    const KEY = "zhihu_dump";
    const u = $request.url;
    const raw = $response.body || "";
    let arr = [];
    try { arr = JSON.parse($persistentStore.read(KEY) || "[]"); } catch (_) {}
    const path = u.split("?")[0];
    const isNew = !arr.some((x) => x.path === path);
    arr = arr.filter((x) => x.path !== path);
    const d = new Date();
    arr.unshift({ path, query: (u.split("?")[1] || "").slice(0, 300), time: d.toLocaleTimeString("zh-CN", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0"), body: raw.slice(0, 10000) });
    $persistentStore.write(JSON.stringify(arr.slice(0, 30)), KEY);
    if (isNew && /launch|splash/i.test(path)) $notification.post("知乎开屏：已抓到响应", path.replace(/^https:\/\//, ""), "打开 https://api.zhihu.com/loon-dump 查看", { openUrl: "https://api.zhihu.com/loon-dump" });
  } catch (e) {
    console.log(`[知乎抓包] 保存失败：${e}`);
  }
  $done({});
})();
