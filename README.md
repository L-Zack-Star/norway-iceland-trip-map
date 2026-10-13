# Nordic Journal 2026 · 北欧追光手记

原生HTML/CSS/JavaScript静态网站，无安装与构建依赖。18天原始行程数据保留在 `dist/assets/data.js`，包括地图、活动、航班、住宿、备忘、路线备选和时区提示。

- `dist/index.html`：摄影首页、每日摘要和可展开详情；首页直接进入行程，路线地图在独立入口保留。
- `dist/assets/journal.js` / `journal.css`：增量界面与交互；原实用功能在 `app.js`。
- `dist/offline.html`：原完整单文件离线版，下载后直接打开。
- `dist/compat.html`：无需脚本的完整阅读版。
- `dist/share/wechat-2026.jpg`：600×600微信接口用方图。
- `dist/share/og-2026.jpg`：1200×630静态OG封面。
- `dist/share/LICENSE.txt`：分享照片署名、原始来源、改编许可。

中文使用系统字体，英文使用Georgia；在线交互无需外部字体、图片或CDN。原项目素材保留，新增WebP压缩版本。部分旅游机构原图转载许可需项目持有人复核，分享封面使用明确CC BY-SA 2.0授权的Eric Kilby冰洞照片。

GitHub Pages：保留现有仓库，提交本项目至main，在Settings → Pages选择GitHub Actions。`.github/workflows/pages.yml`自动上传 `dist/` 并部署；`scripts/configure-pages.py`在发布时设置github.io正式地址的canonical与OG绝对链接，图片和脚本使用相对路径，支持项目子目录。公开仓库使用免费Pages，不需要服务器、自定义域名或密钥。

每次更新 `dist/` 源文件并推送main，Actions自动部署。仅修改数据时，保持原字段与JSON格式；改分享图建议更换文件名，同时更新index.html元信息，减少缓存干扰。微信仍可能保留历史缓存，不能保证强制刷新。

微信：没有公众号接口权限、安全域名配置或可信签名服务时，不加载JS-SDK，不承诺自定义卡片。HTML静态元信息可供爬虫读取；方图仅用于具备授权的 `updateAppMessageShareData` / `updateTimelineShareData` 配置，不伪造额外微信元标签。真正接入仍需核实公众号分享接口权限、JS接口安全域名及验证文件部署权、完整URL签名和安全保存AppSecret的服务。纯静态公开仓库不能保存AppSecret。

支持原生Web Share API，失败时复制链接；微信内引导右上角菜单。无真实iOS/Android微信、Safari或中国大陆无VPN网络测试条件，不将UA模拟或本地Chrome测试视为上述场景通过。

正式网址：https://leizheqi-star.github.io/norway-iceland-trip-map/ 。发布来源使用 GitHub Actions，避免旧分支发布流程覆盖新版。原仓库地图保存在 legacy/index.html，文件未删除。

