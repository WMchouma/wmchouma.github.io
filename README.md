# 雾眠筹码

音乐与摄影的个人空间，采用 Frutiger Aero 风格。

网站：https://wmchouma.github.io/

## 维护

这是静态站点，无需构建。GitHub Pages 从 main 分支根目录发布。

- index.html：共享导航、播放器、照片预览。
- app.js：页面切换、搜索和播放。
- styles.css：玻璃主题与响应式。
- content.js：48 首歌曲资料与摄影列表。
- friends.js：好朋友答题、服务器提交与共享名单。
- assets/：背景和现有本地音乐。

歌曲信息与摄影作品在 content.js 中更新。摄影页已有 4 张图片和 1 段视频，素材位于 assets/gallery/。图片使用 WebP 缩略图和大图，视频使用 MP4 与静态预览图。

《追逐阿航》支持本地播放；其他歌曲提供网易云链接。未提供其他歌曲音频或封面。

装饰素材来自 Make Aero。来源见 ASSETS.md 与 credits.html；相关 MIT 声明保留在 vendor/MAKE-AERO-LICENSE.md。

好朋友名单：https://wmchouma.github.io/#friends

输入名字后答题，10 道题答对至少 8 道才能加入。Cloudflare Workers 负责判分，D1 保存名字、成绩和日期，所有访客共享同一份名单。支持刷新、分页、重名检查与失败重试。此功能是公开名册，不含密码或账号登录。

接口：https://wumian-friends-api.wmchouma.workers.dev/api/friends

后端源码和标准答案单独维护，不发布到本站静态目录。旧版本机名单不自动导入云端。
