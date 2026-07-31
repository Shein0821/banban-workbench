-- ============================================================
-- 时宜的工作台 - inbox_images 多分类支持
-- 为 inbox_images 表添加 classifications JSONB 字段
-- 存储格式: [{group_id, item_id, description, growth_log_id}]
-- ============================================================

-- 添加 classifications 字段（存储所有分类，旧字段 classified_group_id/classified_item_id 保留第一个用于兼容）
ALTER TABLE inbox_images ADD COLUMN IF NOT EXISTS classifications JSONB DEFAULT '[]';

-- 添加注释
COMMENT ON COLUMN inbox_images.classifications IS 'AI 多分类结果数组 [{group_id, item_id, description, growth_log_id}]';

-- 验证
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'inbox_images' AND column_name = 'classifications';
