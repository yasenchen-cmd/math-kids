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

## 功能概览

- **29 个技能**，覆盖数感、规律、加减、形状、乘法、时间/钱币/分数、除法
- **操作教具**：拖拽合并/拿走/平分、十格板、填数组、点数、比较、排序、分数份数等
- **自适应**：难度、干扰项数量、是否自动朗读、是否显示示意图，随掌握度调整
- **节奏导演**：挫败时降难度 / 强制干预，掌握时适度加难
- **免费试用 3 次练习**（点「一起学」才扣次）；PRO 用设备绑定解锁码

## 卖家解锁工具

付款确认后打开 `unlock-tool.html`（或线上 `/math-kids/unlock-tool.html`），输入买家设备 ID，生成解锁码。算法与 App 内 `src/utils/unlockCode.js` 一致（须手改同步）。

## 技术栈

React 18 · Vite 5 · Vitest · 纯静态（无后端）
