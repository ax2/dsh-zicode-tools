# zicode 开发工具箱 · dsh-zicode-tools

给开发者用的 DSH 工具集合：入口是左侧栏底部的「开发工具箱」菜单，菜单内显示 **zicode 开发工具箱**，二级菜单直接列出常用工具；完整面板里有 14 个工具、官网与公众号二维码。全部在浏览器本地计算，不联网、不写会话、不改任何 DSH 配置。

## 入口与二级菜单

| 入口 | 位置 | 说明 |
| --- | --- | --- |
| 「开发工具箱」菜单 | 左侧栏底部、**设置**按钮正上方 | 点开是二级菜单（标题「zicode 开发工具箱」），直接列出常用工具；侧栏收起时显示为图标 |
| 菜单底部 | 菜单内 | 「全部工具…」「菜单设置…」「关于 zicode…」 |
| 完整面板页脚 | 面板底部 | 显示 **www.zicode.com** 链接与公众号二维码缩略图，点二维码进入「关于 zicode」 |
| 快捷键 | 默认 `Alt+Shift+Z`（Web 版 `Ctrl+Alt+Z`） | 打开完整面板；在 **设置 → 快捷键** 里可改 |

**二级菜单规则**

- 默认显示 **6 个**工具，可在「菜单设置」里改成 3–14 个。
- 排序默认「常用优先」：按你打开该工具的次数从多到少，次数相同按手动顺序。
- 也可切到「手动排序」，用 ↑/↓ 调整全部 14 个工具的顺序；侧栏面板的工具列表同步使用这个手动顺序。
- 使用次数与排序保存在浏览器本地（`localStorage`，键 `dsh-zicode-tools:prefs`），不经过 Host。

设计理由：`sidebar.footer.action` 是根级常驻槽位，不依赖会话，和「设置」同级；二级菜单在一个 248px 的浮层里，不会被侧栏 `overflow` 裁切；完整面板放在 `shell.overlay`，需要时再看全部工具。

## 按钮层级

- 每个工具最多一个**填充主按钮**：JSON「格式化」、编码「编码」、密码「生成」、UUID「生成」、Cron「接下来 5 次」；其余动作统一为描边按钮。
- 开关/多选使用胶囊（chip）；紧凑操作用 24px 图标按钮；侧栏导航与二级菜单行不带边框。
- 主按钮使用 DSH 的 `button-primary-fill` + `label-primary-foreground`：浅色主题近黑底白字，深色主题近白底深字，文字跟随主题翻转。这是宿主的语义令牌，不是写死的颜色，所以**不同主题下同一个按钮会呈现相反明暗**，属于预期行为。

## 品牌与官网

- 菜单标题、完整面板标题与插件详情页标题都显示 **zicode 开发工具箱**。
- 完整面板页脚常驻显示 **www.zicode.com** 与公众号二维码缩略图；点二维码或「公众号」进入 **关于 zicode** 页。
- 「关于 zicode」页包含：版本、官网链接与复制、软件模块入口、180px 公众号二维码（可直接扫码关注「字与码」），以及“软件模块入口与 DSH 插件落地页将在这里上线”的说明。
- 二维码原图来自 `https://zicode.com/qrcode_zicode.jpg`，以内嵌 data URL 形式随插件分发，离线可用；原图也随包保留在 [assets/qrcode_zicode.jpg](dsh-zicode-tools/assets/qrcode_zicode.jpg) 以便替换。
- 后续在 www.zicode.com 软件模块上线入口/落地页后，只需改 `client.js` 顶部的 `BRAND_HOME` / `BRAND_SOFTWARE` 两个常量。

## 工具（14 个）

| 工具 | 能力 |
| --- | --- |
| **JSON** | 格式化（2/4 空格、Tab）、压缩、校验、键排序；出错给出行列位置 |
| **编码转换** | Base64（含 URL-safe）、URL 编码、HTML 实体、Unicode 转义、UTF-8 十六进制，双向转换 |
| **密码生成** | 长度 4–64，大写/小写/数字/符号任选，排除 `Il1O0o`；`crypto.getRandomValues` 无偏随机；实时熵值与强度 |
| **正则测试** | 模式 + g/i/m/s/u 标志、实时高亮、匹配位置与捕获组、替换预览 |
| **时间戳** | 实时秒/毫秒/本地/UTC/ISO；时间戳 ↔ 日期双向转换 |
| **颜色** | HEX / RGB / HSL 互转，支持 `#rgb`、`#rrggbb(aa)`、`rgb()`、`rgba()`、`hsl()`、`hsla()` 与常用颜色名；取色器与透明色块预览 |
| **ASCII 码表** | 0–127 的 DEC/HEX/OCT/BIN/字符/名称；输入字符、十进制或 `0x41` 直接查；方向键浏览、回车复制 |
| **哈希** | SHA-1 / SHA-256 / SHA-384 / SHA-512，输出十六进制与 Base64 |
| **UUID** | 批量生成 v4 UUID（1–50 个），可大写、可去短横线 |
| **文本对比** | 逐行 LCS diff，标出新增/删除，复制统一格式结果 |
| **URL 解析** | 拆分协议/主机/端口/路径/查询串/锚点，解码查询参数，复制为 JSON |
| **文本工具** | 字符、UTF-8 字节、词、行、中文数统计；大小写与 camel/snake/kebab/CONSTANT 命名转换 |
| **JWT 解码** | 解码 header/payload，显示 exp/iat/nbf；不校验签名 |
| **Cron 解析** | 五段式 Cron 解析 + 接下来 5 次运行时间（处理 DOM/DOW 的 OR 语义） |

## 安装

### 桌面版

1. 左侧栏 **插件** → **Add plugin**
2. 选择本目录 `dsh-zicode-tools`（本地目录安装会链接源码，改完重启/刷新即可生效）

### 命令行

```sh
dsh plugin --profile <profile> add link:/绝对路径/dsh-zicode-tools
# 或从 GitHub
dsh plugin --profile <profile> add github:ax2/dsh-zicode-tools
```

## 实现说明

```
dsh-zicode-tools/
├── package.json        # dsh.bundle.patch + dsh.client（Web 平台、启动即预取）
├── cordis.patch.yml    # 插入 zicode-tools 一行
├── index.js            # Host 半边：空实现，仅保持插件行存活
├── client.js           # 浏览器半边：槽位、二级菜单、设置、14 个工具
├── locale/en.json      # 插件管理器展示用的英文元数据
├── locale/zh.json      # 中文元数据
├── icon.svg            # 插件图标
├── docs/               # 详情页插图
├── assets/             # 公众号二维码原图（运行时用内嵌 data URL）
└── test/smoke.mjs      # 集成冒烟测试（不模拟浏览器）
```

- 槽位：`sidebar.footer.action`（菜单按钮）与 `shell.overlay`（完整面板），通过 `ctx.slots.inject` + `ctx.slots.register` 注册，随插件卸载自动清理。
- 二级菜单：自绘 `role="menu"` 浮层（固定定位、测量锚点），支持 ↑/↓/Enter/Esc、点击外部关闭、焦点归位。
- 快捷键通过 `ctx.shortcuts.register` 注册，出现在「设置 → 快捷键」，冲突由宿主检查。
- 文案走 `ctx.locale` 命名空间 `zicode-tools`，内置中英文；其余语言回退英文。
- 样式只用 `--dsw-alias-*` / `--dsh-font-family-code` 主题变量，浅色/深色跟随宿主；不 import 任何 DSH Client 包，也不操作其他插件的 DOM。

## 兼容性

- 在 DeepSeek Harness `0.2.2-rc.5`（Desktop profile）上验证。
- 哈希、随机数、UUID 依赖 `crypto.subtle` / `crypto.getRandomValues`；`http://127.0.0.1` 属于安全上下文，正常可用。

## 已知限制

- ASCII 表固定 0–127；128 以上字符在查询卡里按 Unicode 码点显示。
- HTML 实体解码覆盖常用命名实体与全部数字实体，不覆盖 HTML5 的完整实体表。
- 复制依赖 `navigator.clipboard`（安全上下文）。
- 部分平台把折叠侧栏收成 0 宽时，侧栏菜单不可见；此时用快捷键打开完整面板。
- 面板页头显示的快捷键为默认值；改键后在「设置 → 快捷键」查看实际绑定。

## 开发自检

```sh
npm run check   # 语法检查
npm test        # 集成冒烟测试：加载模块、执行 apply、渲染 14 个工具与设置页
```

`test/smoke.mjs` 用最小 React 桩执行客户端模块，检查槽位注册、快捷键、中英词典一致性、14 个工具与菜单设置的默认渲染，不模拟浏览器，也不替代真机视觉验证。

## English

A local-only developer toolbox for DeepSeek Harness. The sidebar-foot **Developer toolbox** menu opens a second-level list of your most-used tools (6 by default, adjustable, ordered by usage or manually); **All tools…** opens the full 14-tool panel, also reachable with `Alt+Shift+Z` (desktop) or `Ctrl+Alt+Z` (web). The panel footer shows www.zicode.com and the WeChat official-account QR, with an About zicode page. Tools: JSON, encoding, password generator, regex tester, timestamps, color, ASCII, hashes, UUID, text diff, URL parser, text tools, JWT decoder and cron parser. Everything runs in the page; nothing is sent anywhere or read from the session.

## License

MIT © 2026 ax2
