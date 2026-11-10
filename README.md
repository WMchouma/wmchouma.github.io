# 雾眠筹码

音乐与摄影的个人空间，采用 Frutiger Aero 风格。

网站：https://wmchouma.github.io/

## 维护

这是静态站点，无需构建。GitHub Pages 从 main 分支根目录发布。

- index.html：共享导航、播放器、照片预览。
- app.js：页面切换、搜索和播放。
- styles.css：玻璃主题与响应式。
- content.js：48 首歌曲资料与摄影列表。
- friends.js：默契测试，题目和计分仅在浏览器本地运行。
- assets/：背景和现有本地音乐。

歌曲信息与摄影作品在 content.js 中更新。摄影页已有 4 张图片和 1 段视频，素材位于 assets/gallery/。图片使用 WebP 缩略图和大图，视频使用 MP4 与静态预览图。

《追逐阿航》支持本地播放；其他歌曲提供网易云链接。未提供其他歌曲音频或封面。

装饰素材来自 Make Aero。来源见 ASSETS.md 与 credits.html；相关 MIT 声明保留在 vendor/MAKE-AERO-LICENSE.md。

默契测试：https://wmchouma.github.io/#friends

十道单选题，结果仅在当前页面显示了解程度百分比。无需姓名或账号；不联网，不记录、不提交答案，也没有朋友名单或相册。整个网站不依赖后端服务。
