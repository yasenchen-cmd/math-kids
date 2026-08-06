---
name: math-kids
description: >-
  Math-Kids 儿童数学互动练习项目约定：出题引擎、教具 mode、解锁码、测试与 GitHub Pages 部署。
  在本仓库改题型、教具、付费墙、技能树或部署时使用。
---

# Math-Kids Agent Skill

## 必守

1. 改 `src/engine/` 或 `src/utils/unlockCode.js` 后跑 `npm run test`
2. 解锁算法只维护一处逻辑源：`src/utils/unlockCode.js`；`unlock-tool.html` 必须手改同步
3. 不要恢复 Cloudflare Worker / 把 `ADMIN_KEY` 写进仓库
4. 新增 manipulative `mode` 时同步：
   - `src/utils/manipModes.js`
   - `src/components/ManipulativeRouter.jsx`
   - 对应 generator +（如有）`skillGraph.interactionModes`
5. 部署用 `sh deploy.sh "说明"`，勿随意 `git add -A`

## 题目契约

`buildQuestion` 产出字段：`skillId`, `prompt`, `promptNarrative`, `answer`, `visual`, `manipulative`, `interactiveFallback`, `choice`, `difficulty`。

已实现 mode：`drag_combine`, `drag_split`, `drag_share`, `drag_to_target`, `fill_array`, `count`, `compare_count`, `pick_one`, `sort`, `fraction_parts`。

## 推荐下一关

用 `recommendNext(completedIds, skillScores, isSkillImplemented)`；UI 在 `SkillTreeView` 与结算页。

## 常用命令

```bash
npm run dev
npm run test
npm run build
sh deploy.sh "更新说明"
```
