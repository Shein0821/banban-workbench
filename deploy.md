# 班班 v19 · 自托管部署指南

> 本目录是「时宜的工作台」前端 v19（支持收集箱图片多分类归类）的自托管包。  
> 把它传到任意免费静态托管（推荐 GitHub Pages）即可运行，**不再消耗 WorkBuddy CloudStudio 额度**。

---

## 📁 包里有什么

| 文件 | 说明 |
|---|---|
| `index.html` | 主应用（单文件，含全部 CSS/JS），v19 多分类版本 |
| `sw.js` | Service Worker，版本 `v19-multi-classify` |
| `manifest.json` | PWA 配置 |
| `icon-*.png` | PWA 图标（192 / 512 / maskable） |
| `deploy.md` | 本说明 |

---

## ✅ 前置条件

1. 一个 **GitHub 账号**（免费）
2. 一个 **Supabase 账号**（免费层够用）
3. （可选）DashScope 账号 + Bark key，如果你想用语音播报和 AI 归类

---

## 🚀 方式一：GitHub Pages 部署（推荐，完全免费）

### 第 1 步：创建仓库

1. 登录 [github.com](https://github.com)
2. 点右上角 **+ → New repository**
3. Repository name 填 `banban-workbench`（随便你）
4. 选 **Public**
5. 勾选 **Add a README file**（可勾可不勾）
6. 点 **Create repository**

### 第 2 步：上传本目录文件

1. 进入刚创建的仓库
2. 点 **Add file → Upload files**
3. 把本目录下所有文件（`index.html`、`sw.js`、`manifest.json`、3 个 icon）拖进去
4. 点 **Commit changes**

### 第 3 步：开启 GitHub Pages

1. 仓库顶部点 **Settings**
2. 左侧选 **Pages**
3. Source 选择 **Deploy from a branch**
4. Branch 选 `main` / `master`，文件夹选 `/ (root)`
5. 点 **Save**
6. 等 1-3 分钟，刷新页面，会出现访问链接：`https://你的用户名.github.io/banban-workbench/`

### 第 4 步：加到手机主屏

1. 手机浏览器打开上面的链接
2. iOS Safari：底部分享按钮 → **添加到主屏幕**
3. Android Chrome：菜单 → **添加到主屏幕**
4. 完成后，手机桌面会出现「工作台」图标，像原生 App

---

## 🚀 方式二：其他静态托管

只要支持纯静态文件即可：

- **Vercel**：导入 GitHub 仓库，自动部署
- **Netlify**：Drop 上传本目录，立即上线
- **Cloudflare Pages**：绑定 GitHub 仓库
- **你自己的服务器 / NAS**：把文件放进 Web 目录

唯一要求：必须通过 **HTTPS** 访问，否则 PWA 功能和 Supabase 同步可能不正常。

---

## 🔧 后端依赖（多分类功能必需）

如果你只用日历、日程、习惯，前端本身就能跑。  
想要「收集箱图片 → AI 自动多分类 → 个人成长板块」这条链路，还需要补后端：

### 1. 数据库加字段

在 Supabase 后台 **SQL Editor** 执行：

```sql
ALTER TABLE inbox_images ADD COLUMN IF NOT EXISTS classifications JSONB DEFAULT '[]';
COMMENT ON COLUMN inbox_images.classifications IS 'AI 多分类结果数组 [{group_id, item_id, description, growth_log_id}]';
```

### 2. 部署 Edge Function

把仓库外层的 `image-classify/index.ts` 部署到 Supabase Functions：

```bash
# 需要 supabase CLI 并已登录
npx supabase functions deploy image-classify --project-ref 你的项目ID
```

如果你不会用 CLI，也可以手动复制 `image-classify/index.ts` 内容，贴到 Supabase 后台 **Edge Functions → New Function → image-classify** 里。

### 3. 配置环境变量

在 Supabase 后台 **Project Settings → Edge Functions → Secrets** 添加：

- `DASHSCOPE_API_KEY`：你的阿里云 DashScope key
- `SUPABASE_URL`：你的 Supabase 项目 URL
- `SUPABASE_SERVICE_ROLE_KEY`：service_role key（不是 anon key）

### 4. 配置定时任务

在 Supabase SQL Editor 执行：

```sql
SELECT cron.schedule(
  'inbox-image-classify',
  '30 15 * * *',  -- UTC 15:30 = 北京时间 23:30
  $$ SELECT net.http_post(
    url := 'https://你的项目ID.supabase.co/functions/v1/image-classify',
    headers := '{"Authorization": "Bearer 你的service_role_key", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) $$
);
```

---

## 🔑 修改 Supabase 配置

打开 `index.html`，找到 `SUPABASE_CONFIG`，把 url 和 anon key 换成你自己的：

```javascript
const SUPABASE_CONFIG = {
  url: 'https://你的项目ID.supabase.co',
  anonKey: '你的 anon key'
};
```

---

## 🧪 本地预览

如果你想先在电脑上看效果：

```bash
# 用 Python 起一个本地服务器
python -m http.server 8080

# 然后浏览器打开
# http://localhost:8080
```

> 注意：直接用 `file://` 打开 `index.html` 会导致 Service Worker 和 PWA 不工作，请一定用本地服务器预览。

---

## ⚠️ 常见坑

1. **GitHub Pages 不生效**：确认仓库是 Public，且 Pages 设置里 Branch 选对了。
2. **图标不显示**：manifest.json 里的 `icons` 路径是相对根目录，确保 3 个 icon 文件和 index.html 在同一级。
3. **Service Worker 不更新**：`sw.js?v=19` 已经加了版本号，如果还是旧的，Chrome 开发者工具 → Application → Service Workers → Unregister，再刷新。
4. **Supabase 同步失败**：检查 anon key 是否填对、RLS 是否放行、是否 HTTPS。
5. **AI 归类没触发**：检查 cron job 是否在 Supabase 里创建成功，Edge Function 日志里看报错。

---

## 💰 费用说明

| 项目 | 是否收费 |
|---|---|
| GitHub Pages 静态托管 | 免费 |
| Supabase 免费层（数据库 + Storage + Edge Function + cron） | 免费，够用 |
| DashScope API（AI 识图 + TTS） | 有免费额度，超出按量付费 |
| Bark 推送到 iPhone | 免费 |
| WorkBuddy CloudStudio | **不再使用，不耗额度** |

---

## 🆘 需要帮助

- 部署卡住：把报错截图发给「小迪」
- 想改配色/功能：让「小迪」给你改 `index.html`
- 想分享给别人：把本目录打包成 zip 即可

---

**版本**：v19-multi-classify  
**整理**：小迪（时宜的 WorkBuddy 搭子）  
**日期**：2026-07-31
