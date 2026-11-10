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
- friend-session.js：私密凭证、备份和身份恢复。
- album.js：挚友相册、图片与视频上传及预览。
- backend-config.js：集中配置接口地址。
- assets/：背景和现有本地音乐。

歌曲信息与摄影作品在 content.js 中更新。摄影页已有 4 张图片和 1 段视频，素材位于 assets/gallery/。图片使用 WebP 缩略图和大图，视频使用 MP4 与静态预览图。

《追逐阿航》支持本地播放；其他歌曲提供网易云链接。未提供其他歌曲音频或封面。

装饰素材来自 Make Aero。来源见 ASSETS.md 与 credits.html；相关 MIT 声明保留在 vendor/MAKE-AERO-LICENSE.md。

好朋友名单：https://wmchouma.github.io/#friends

输入名字后点击选项，10 道题答对至少 8 道才能加入。Cloudflare Workers 负责判分，D1 保存共享名单。支持刷新、分页、重名检查与失败重试。

挚友相册：https://wmchouma.github.io/#album

答题通过后生成私密凭证，可备份和换设备导入。新成员先待确认，通过原有联系方式向站点主人发送编号与核验码；主人确认本人后开通相册权限。服务端校验凭证、名单和确认状态，不以姓名作为登录依据。图片最大 8 MB，视频最大 20 MB，相册总额 200 MB；支持预览、上传重试和删除自己的作品。

后端迁移暂缓，继续使用现有 Cloudflare。国内连通性问题尚待解决，没有启用腾讯云或付费存储。

接口：https://wumian-friends-api.wmchouma.workers.dev/api/friends

后端源码和标准答案单独维护，不发布到本站静态目录。旧版本机名单不自动导入云端。
