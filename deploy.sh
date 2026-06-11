#!/bin/bash
# 一键部署脚本
# 用法：sh deploy.sh "更新说明"

set -e

MSG="${1:-自动部署}"

cd "$(dirname "$0")"

echo "🔨 构建中..."
npx vite build

echo "📁 同步到 docs/"
rm -rf docs
cp -r dist docs
cp unlock-tool.html docs/ 2>/dev/null || true

echo "📦 提交中..."
git add -A
git commit -m "$MSG"

echo "🚀 推送到 GitHub..."
git push origin main

echo "✅ 部署完成！等待 1-2 分钟 GitHub Pages 自动更新"
echo "   https://yasenchen-cmd.github.io/math-kids/"
