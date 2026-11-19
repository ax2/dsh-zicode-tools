# 字码工具箱 · dsh-zicode-tools

给开发者用的 DSH 小工具集合：ASCII 码表、编码转换、密码生成、JSON 美化、颜色转换、时间戳、UUID、SHA 哈希。

全部在浏览器本地计算，不联网、不写会话、不改任何 DSH 配置。

## 入口在哪

| 入口 | 位置 | 说明 |
| --- | --- | --- |
| 侧栏按钮 | 左侧栏底部、**设置**按钮正上方 | 常驻，不需要打开会话；侧栏收起时显示为图标 |
| 快捷键 | 默认 `Alt+Shift+Z`（Web 版默认 `Ctrl+Shift+K`） | 在 **设置 → 快捷键** 里可改；`Esc` 或点击遮罩关闭 |

打开后是一个居中浮层：左侧 8 个工具，右侧是当前工具面板。工具面板顶部有搜索框，可按名称或描述过滤。

> 设计理由：`sidebar.footer.action` 是根级常驻槽位，和「设置」同级，任何页面都能点到；浮层放在 `shell.overlay`（框架级浮层），不会被侧栏或对话区的 `overflow` 裁切。没有塞进输入框工具条，是因为这些工具和「正在写的这条消息」无关，塞进去会挤占发送按钮附近的空间。

## 工具

| 工具 | 能力 |
| --- | --- |
| **ASCII 码表** | 0–127 的 DEC / HEX / OCT / BIN / 字符 / 名称表；输入字符、十进制或 `0x41` 直接查；任意字符可看 Unicode 码点；点击行复制 |
| **编码转换** | Base64（含 URL-safe）、URL 编码、HTML 实体、Unicode 转义、UTF-8 十六进制，双向转换 |
| **密码生成** | 长度 4–64，大写/小写/数字/符号任选，排除 `Il1O0o`；基于 `crypto.getRandomValues` 的无偏随机；实时熵值与强度 |
| **JSON** | 格式化（2/4 空格、Tab）、压缩、校验、键排序；出错给出行列位置 |
| **颜色** | HEX / RGB / HSL 互转，支持 `#rgb`、`#rrggbb(aa)`、`rgb()`、`rgba()`、`hsl()`、`hsla()` 与常用颜色名；取色器与透明色块预览 |
| **时间戳** | 实时显示当前秒/毫秒/本地/UTC/ISO；时间戳 ↔ 日期双向转换 |
| **UUID** | 批量生成 v4 UUID（1–50 个），可大写、可去短横线，单个或全部复制 |
| **哈希** | SHA-1 / SHA-256 / SHA-384 / SHA-512，输出十六进制与 Base64 |

## 安装

### 桌面版

1. 左侧栏 **插件** → **Add plugin**
2. 选择本目录 `dsh-zicode-tools`（本地目录安装会链接源码，改完重启宿主即可生效）

### 命令行

```sh
dsh plugin --profile <profile> add link:/绝对路径/dsh-zicode-tools
```

发布到 npm / GitHub 后也可以直接按包名或仓库地址安装。

## 实现说明

```
dsh-zicode-tools/
├── package.json        # dsh.bundle.patch + dsh.client（Web 平台、启动即预取）
├── cordis.patch.yml    # 插入 zicode-tools 一行
├── index.js            # Host 半边：空实现，仅保持插件行存活
├── client.js           # 浏览器半边：两个槽位 + 8 个工具
├── locale/en.json      # 插件管理器展示用的英文元数据
├── locale/zh.json      # 中文元数据
├── icon.svg            # 插件图标
└── docs/               # 详情页插图
```

- 槽位注册：`sidebar.footer.action`（按钮）与 `shell.overlay`（浮层），都通过 `ctx.slots.inject` + `ctx.slots.register` 完成，随插件卸载自动清理。
- 快捷键通过 `ctx.shortcuts.register` 注册，会出现在「设置 → 快捷键」里，冲突由宿主检查，用户可改键。
- 文案走 `ctx.locale` 命名空间 `zicode-tools`，内置中英文；其余语言回退到英文。
- 样式只用 `--dsw-alias-*` 主题变量，浅色/深色跟随宿主。
- 不 import 任何 DSH Client 包，也不操作其他插件的 DOM。

## 兼容性

- 在 DeepSeek Harness `0.2.2-rc.5`（Desktop profile）上验证。
- 哈希与随机数依赖 `crypto.subtle` / `crypto.getRandomValues`；`http://127.0.0.1` 属于安全上下文，正常可用。

## 已知限制

- ASCII 表固定 0–127；128 以上字符在查询卡里按 Unicode 码点显示。
- HTML 实体解码覆盖常用命名实体与全部数字实体，不覆盖 HTML5 的完整实体表。
- 复制依赖 `navigator.clipboard`（安全上下文）。

## 开发自检

```sh
npm run check   # 语法检查
npm test        # 集成冒烟测试：加载模块、执行 apply、渲染 8 个工具
```

`test/smoke.mjs` 用最小 React 桩执行客户端模块并检查槽位注册、快捷键、中英词典一致性与每个工具的默认渲染，不模拟浏览器，也不替代真机视觉验证。

## English

A local-only developer toolbox for DeepSeek Harness. The launcher sits at the sidebar foot, directly above Settings, and the same panel opens with `Alt+Shift+Z` (desktop) or `Ctrl+Shift+K` (web); both are editable under Settings → Shortcuts. It ships an ASCII table, Base64/URL/HTML/Unicode/hex conversion, a crypto-random password generator, JSON formatting and validation, HEX/RGB/HSL conversion, timestamps, UUID batches, and SHA digests. Everything runs in the page; nothing is sent anywhere or read from the session.

## License

MIT © 2026 ax2
