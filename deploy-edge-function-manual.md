# image-classify v19 · 手动部署指南

> 如果 `npx supabase functions deploy` 因为没登录 CLI 跑不通，按本指南手动把代码贴到 Supabase 后台即可。效果完全一样，**不花 WorkBuddy 额度**。

---

## 步骤 1：打开 Supabase Edge Functions 编辑器

1. 登录 [supabase.com](https://supabase.com)
2. 进入你的项目 `gireppsqrggetxzfaiey`
3. 左侧菜单选 **Edge Functions**
4. 点 **New function**
5. Function name 填 `image-classify`
6. 点 **Create function**

---

## 步骤 2：覆盖代码

把仓库外层 `image-classify/index.ts` 的完整内容**全选复制**，贴到 Supabase 编辑器里，覆盖默认生成的代码。

> 如果找不到文件，核心逻辑摘要如下：
> - 读取 `inbox_images` 表里 `status = 'pending'` 的图片
> - 从 Supabase Storage 下载图片 → base64
> - 调 DashScope Qwen-VL (`qwen-vl-max`) 识别图片
> - AI 返回 1~4 个分类（穿搭 / 拍照姿势 / 发型 / 妆容 / 审美 等）
> - 每个分类在 `growth_logs` 表创建一条学习记录，共享同一张图片
> - 更新 `inbox_images.status = 'filed'` 并写入 `classifications` JSONB 数组

---

## 步骤 3：添加 Secrets

在 Supabase 后台：

**Project Settings → Edge Functions → Secrets** 添加以下 key：

| Secret Name | Value |
|---|---|
| `DASHSCOPE_API_KEY` | 你的 DashScope API key |
| `SUPABASE_URL` | `https://gireppsqrggetxzfaiey.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | 你的 service_role key（不是 anon key） |

---

## 步骤 4：部署

点编辑器右上角的 **Deploy**。等待几秒，看到绿色成功提示即可。

---

## 步骤 5：配置定时任务

在 Supabase **SQL Editor** 执行：

```sql
-- 每天北京时间 23:30 自动归类收集箱图片
SELECT cron.schedule(
  'inbox-image-classify',
  '30 15 * * *',
  $$ SELECT net.http_post(
    url := 'https://gireppsqrggetxzfaiey.supabase.co/functions/v1/image-classify',
    headers := '{"Authorization": "Bearer 你的service_role_key", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) $$
);
```

如果之前已经建过同名 cron job，先删除再重建：

```sql
SELECT cron.unschedule('inbox-image-classify');
```

---

## 步骤 6：验证

1. 在班班收集箱「图片」页面上传一张图片（比如穿搭照）
2. 等 23:30 自动跑，或临时改 cron 时间提前触发
3. 打开 Supabase **Edge Functions → image-classify → Logs** 看执行日志
4. 成功后进入「个人成长」对应板块，应该能看到带图片的学习记录

---

## 自动部署（可选）

如果你有 Supabase access token，也可以一行命令部署：

```bash
npx supabase login
# 粘贴 access token

npx supabase functions deploy image-classify --project-ref gireppsqrggetxzfaiey
```

---

**整理**：小迪  
**日期**：2026-07-31
