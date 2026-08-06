# Math-Kids — 儿童数学互动练习

> **窗口范围**：仅 `/home/chenys/math-kids`。GitHub Pages 静态部署。

React + Vite 儿童数学游戏：自适应出题、操作教具、语音反馈、庆祝动效。

**线上**：https://yasenchen-cmd.github.io/math-kids/

## Commands

```bash
npm install
npm run dev          # 本地开发 http://localhost:5173
npm run build        # 输出 dist/
npm run test         # vitest
npm run test:watch

# 一键部署（build → docs/ → 仅提交 docs 相关 → git push）
sh deploy.sh "更新说明"
```

## 架构

```
src/
├── engine/                 # 出题引擎
│   ├── generators/         # 加减乘除、比较、几何、分数…
│   ├── adaptive.js         # 难度自适应
│   ├── director/           # sessionState + pacingDirector
│   ├── skillGraph.js       # 技能树 + recommendNext
│   └── questionGenerator.js
├── components/
│   ├── manipulative/       # 操作教具（含 sort / drag_to_target / fraction_parts）
│   ├── ManipulativeRouter.jsx
│   └── GameScreen.jsx
├── hooks/                  # useSpeech, useSpeechRecognition, usePayment…
├── utils/                  # platform, unlockCode, manipModes, sound
└── data/characters.js      # 角色 mascot
tests/                      # 引擎 + 解锁码 + 导演层单测
docs/                       # GitHub Pages 部署目录（build 产物）
.cursor/skills/math-kids/   # 本项目 Agent Skill
```

## Conventions

- **Package manager**：npm
- **测试**：vitest；改 `engine/` 或解锁逻辑后跑 `npm run test`
- **部署**：`deploy.sh` 只 stage `docs/` + `unlock-tool.html`，勿 `git add -A`
- **解锁码**：`src/utils/unlockCode.js` 与根目录 `unlock-tool.html` 必须同步；勿把密钥写进 Worker
- **教具 mode**：新增 mode 时同时改 `manipModes.js`、`ManipulativeRouter.jsx`、对应 generator
- **平台检测**：`src/utils/platform.js`（移动端 / 语音 API）

## WSL 说明

- 纯前端项目，WSL 开发无特殊限制
- 语音 API（Web Speech）在浏览器端运行，与 WSL 无关
- 部署需 git push 权限
