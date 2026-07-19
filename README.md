# 数学闯关（Math-Kids）

幼儿园～小学三年级趣味数学练习：自适应出题、操作教具、语音反馈。

**线上**：https://yasenchen-cmd.github.io/math-kids/

## 本地开发

```bash
npm install
npm run dev      # http://localhost:5173
npm run test
npm run build
```

## 部署

```bash
sh deploy.sh "更新说明"
```

会构建并同步到 `docs/`，提交后推送到 GitHub Pages。

## 卖家解锁工具

付款确认后打开 `unlock-tool.html`（或线上 `/math-kids/unlock-tool.html`），输入买家设备 ID，生成解锁码。算法与 App 内 `src/utils/unlockCode.js` 一致。

## 技术栈

React 18 · Vite 5 · Vitest · 纯静态（无后端）
