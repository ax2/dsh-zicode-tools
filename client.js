/**
 * Zicode tools — Client half.
 *
 * A single browser module registered through `window.__ModuleLoader__.load`.
 * It contributes two slots:
 *   - `sidebar.footer.action`: a toolbox row above the Settings seat.
 *   - `shell.overlay`: the floating toolbox panel it opens.
 *
 * Every tool computes in the page with Web APIs only (TextEncoder, Web Crypto,
 * Intl). No request leaves the renderer, and no session state is read.
 */
window.__ModuleLoader__.load({
  id: 'dsh-zicode-tools',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { Fragment, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } = React

    const NS = 'zicode-tools'
    const DESKTOP = typeof window !== 'undefined' && window.dshDesktop !== undefined
    const MAC = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform === undefined ? '' : navigator.platform)
    const HOTKEY = DESKTOP ? (MAC ? '⌥⇧Z' : 'Alt+Shift+Z') : (MAC ? '⌘⌥Z' : 'Ctrl+Alt+Z')
    const HOTKEY_ARIA = DESKTOP ? 'Alt+Shift+Z' : 'Control+Alt+Z'
    const MODAL_ID = 'zicode-tools'
    const SETTINGS_ID = '__menu-settings'
    const ABOUT_ID = '__about'
    const PREFS_KEY = 'dsh-zicode-tools:prefs'
    const BRAND_HOME = 'https://www.zicode.com'
    const BRAND_SOFTWARE = 'https://www.zicode.com/software/'
    const BRAND_GITHUB = 'https://github.com/ax2/dsh-zicode-tools'
    const BRAND_SITE_LABEL = 'www.zicode.com'
    const VERSION = '0.4.0'

    /* --------------------------------------------------------------- locale */

    const EN = {
      'action.label': 'Developer toolbox',
      'action.title': 'Developer toolbox',
      'shortcut.label': 'Open the developer toolbox',
      'panel.title': 'zicode Developer toolbox',
      'panel.subtitle': 'Local developer utilities',
      'panel.search': 'Search tools',
      'panel.tools': 'Tools',
      'panel.close': 'Close',
      'panel.hotkeyHint': 'Default shortcut; change it under Settings → Shortcuts',
      'panel.toggle': 'toggle',
      'panel.local': 'Runs locally',
      'panel.noMatch': 'No matching tool',
      'panel.esc': 'to close',
      'menu.title': 'zicode Developer toolbox',
      'menu.all': 'All tools…',
      'menu.settings': 'Menu settings…',
      'menu.about': 'About zicode…',
      'menu.github': 'GitHub / Star…',
      'footer.site': 'www.zicode.com',
      'footer.wechat': 'WeChat',
      'footer.qrHint': 'Show the WeChat QR code',
      'about.title': 'About zicode',
      'about.desc': 'Version, website and the WeChat official account for this toolbox.',
      'about.version': 'Version',
      'about.website': 'Website',
      'about.wechat': 'WeChat official account',
      'about.scan': 'Scan to follow “ZiCode 字与码”',
      'about.software': 'Software',
      'about.note': 'The software entry and DSH plugin landing page will go live on zicode.com.',
      'about.copyLink': 'Copy link',
      'about.github': 'GitHub',
      'about.star': 'Star this project',
      'about.starNote': 'If this toolbox helps you, a star on GitHub is appreciated.',
      'settings.title': 'Menu settings',
      'settings.desc': 'Choose the tools in the sidebar menu, how many show, and their order.',
      'settings.sort': 'Order',
      'settings.sortUsage': 'Most used',
      'settings.sortManual': 'Manual',
      'settings.visible': 'Tools in the menu',
      'settings.hint': 'Most used ranks by opens; ties follow the manual order.',
      'settings.order': 'Manual order',
      'settings.uses': 'uses',
      'settings.moveUp': 'Move up',
      'settings.moveDown': 'Move down',
      'settings.reset': 'Reset',
      'common.copy': 'Copy',
      'common.copied': 'Copied',
      'common.copyFailed': 'Copy failed',
      'common.clear': 'Clear',
      'common.generate': 'Generate',
      'common.encode': 'Encode',
      'common.decode': 'Decode',
      'common.swap': 'Use as input',
      'common.emptyInput': 'Type something first',
      'tool.ascii.title': 'ASCII table',
      'tool.ascii.desc': 'Look up decimal, hex, octal and binary codes for 0–127, or inspect the code points of any character.',
      'ascii.probe': 'Type a character, a code, or 0x41',
      'ascii.char': 'Character',
      'ascii.control': 'Control',
      'ascii.printable': 'Printable',
      'ascii.unicode': 'Unicode',
      'ascii.dec': 'DEC',
      'ascii.hex': 'HEX',
      'ascii.oct': 'OCT',
      'ascii.bin': 'BIN',
      'ascii.name': 'NAME',
      'ascii.codepoint': 'Unicode',
      'ascii.copyHint': 'Click a row to copy its character or escape',
      'ascii.outside': 'Outside ASCII, shown by Unicode code point.',
      'ascii.noMatch': 'No code in 0–127 matches',
      'tool.encode.title': 'Encoding',
      'tool.encode.desc': 'Convert text between Base64, URL encoding, HTML entities, Unicode escapes and UTF-8 hex.',
      'encode.input': 'Text to convert',
      'encode.output': 'Result',
      'encode.base64': 'Base64',
      'encode.url': 'URL',
      'encode.html': 'HTML entity',
      'encode.unicode': 'Unicode escape',
      'encode.hex': 'Hex (UTF-8)',
      'encode.invalidBase64': 'Invalid Base64 input',
      'encode.invalidUrl': 'Invalid URL-encoded input',
      'encode.invalidHex': 'Hex must be byte pairs such as 41 42',
      'encode.invalidUnicode': 'Invalid Unicode escape',
      'encode.invalidHtml': 'Invalid HTML entity input',
      'encode.urlSafe': 'URL-safe (no padding)',
      'tool.password.title': 'Password',
      'tool.password.desc': 'Cryptographically random passwords with a live entropy estimate.',
      'password.length': 'Length',
      'password.upper': 'Uppercase A–Z',
      'password.lower': 'Lowercase a–z',
      'password.digits': 'Digits 0–9',
      'password.symbols': 'Symbols',
      'password.ambiguous': 'Exclude look-alikes (Il1O0o)',
      'password.strength': 'Strength',
      'password.entropy': 'Entropy',
      'password.bits': 'bits',
      'password.weak': 'Weak',
      'password.medium': 'Fair',
      'password.strong': 'Strong',
      'password.veryStrong': 'Very strong',
      'password.noSets': 'Select at least one character set',
      'tool.json.title': 'JSON',
      'tool.json.desc': 'Format, minify or validate JSON, with line and column on errors.',
      'json.input': 'Paste JSON',
      'json.output': 'Formatted JSON',
      'json.indent': 'Indent',
      'json.spaces2': '2 spaces',
      'json.spaces4': '4 spaces',
      'json.tab': 'Tab',
      'json.sort': 'Sort keys',
      'json.format': 'Format',
      'json.minify': 'Minify',
      'json.validate': 'Validate',
      'json.valid': 'Valid JSON',
      'json.invalid': 'Invalid JSON',
      'json.chars': 'chars',
      'json.line': 'line',
      'json.column': 'column',
      'tool.color.title': 'Color',
      'tool.color.desc': 'Convert HEX, RGB and HSL values with a live swatch.',
      'color.input': 'HEX, rgb() or hsl()',
      'color.invalid': 'Unrecognized color',
      'color.pick': 'Pick',
      'color.preview': 'Preview',
      'tool.timestamp.title': 'Timestamp',
      'tool.timestamp.desc': 'Convert Unix timestamps to local and UTC time, and back.',
      'timestamp.now': 'Now',
      'timestamp.seconds': 'Seconds',
      'timestamp.millis': 'Milliseconds',
      'timestamp.local': 'Local time',
      'timestamp.utc': 'UTC',
      'timestamp.iso': 'ISO 8601',
      'timestamp.tsInput': 'Timestamp (seconds or ms)',
      'timestamp.dateInput': 'Date and time',
      'timestamp.relative': 'Relative',
      'timestamp.invalid': 'Invalid timestamp',
      'tool.uuid.title': 'UUID',
      'tool.uuid.desc': 'Generate batches of random version-4 UUIDs.',
      'uuid.count': 'Count',
      'uuid.upper': 'Uppercase',
      'uuid.noDash': 'Without dashes',
      'uuid.copyAll': 'Copy all',
      'tool.hash.title': 'Hash',
      'tool.hash.desc': 'SHA-1, SHA-256, SHA-384 and SHA-512 digests of text.',
      'hash.input': 'Text to hash',
      'hash.hex': 'Hex',
      'hash.base64': 'Base64',
      'hash.computing': 'Computing…',
      'hash.unsupported': 'Web Crypto is unavailable on this page',
      'hash.empty': 'Type text to compute its digest',
      'tool.regex.title': 'Regex tester',
      'tool.regex.desc': 'Test a pattern against text, inspect captures, and preview replacements.',
      'regex.pattern': 'Pattern',
      'regex.flags': 'Flags',
      'regex.flag.g': 'Global (g)',
      'regex.flag.i': 'Ignore case (i)',
      'regex.flag.m': 'Multiline (m)',
      'regex.flag.s': 'Dot matches newline (s)',
      'regex.flag.u': 'Unicode (u)',
      'regex.text': 'Text',
      'regex.matches': 'matches',
      'regex.replacement': 'Replacement ($&, $1)',
      'regex.result': 'Replaced text',
      'tool.cron.title': 'Cron expression',
      'tool.cron.desc': 'Resolve a five-field cron expression and preview its next runs.',
      'cron.expression': 'Cron expression',
      'cron.next': 'Next 5 runs',
      'cron.invalid': 'Invalid five-field cron expression',
      'cron.minute': 'Minute',
      'cron.hour': 'Hour',
      'cron.day': 'Day',
      'cron.month': 'Month',
      'cron.weekday': 'Weekday',
      'cron.empty': 'Press “Next 5 runs” to compute upcoming times.',
      'cron.localHint': 'Times use the local time zone.',
      'tool.url.title': 'URL parser',
      'tool.url.desc': 'Break a URL into its parts and decoded query parameters.',
      'url.input': 'URL',
      'url.invalid': 'Enter an absolute URL with a scheme, such as https://…',
      'url.origin': 'Origin',
      'url.protocol': 'Protocol',
      'url.host': 'Host',
      'url.port': 'Port',
      'url.path': 'Path',
      'url.search': 'Search',
      'url.hash': 'Hash',
      'url.key': 'Key',
      'url.value': 'Value',
      'url.noParams': 'No query parameters',
      'url.copyJson': 'Copy as JSON',
      'tool.text.title': 'Text tools',
      'tool.text.desc': 'Character, byte, word and line counts plus case conversion.',
      'text.input': 'Text',
      'text.chars': 'chars',
      'text.bytes': 'bytes',
      'text.words': 'words',
      'text.lines': 'lines',
      'text.cjk': 'CJK',
      'text.upper': 'UPPER',
      'text.lower': 'lower',
      'text.title': 'Title Case',
      'text.camel': 'camelCase',
      'text.pascal': 'PascalCase',
      'text.snake': 'snake_case',
      'text.kebab': 'kebab-case',
      'text.constant': 'CONSTANT_CASE',
      'text.trim': 'Trim spaces',
      'tool.jwt.title': 'JWT decoder',
      'tool.jwt.desc': 'Decode a JWT header and payload with claim times; the signature is not verified.',
      'jwt.input': 'JWT',
      'jwt.invalid': 'Invalid JWT or non-JSON payload',
      'jwt.header': 'Header',
      'jwt.payload': 'Payload',
      'jwt.exp': 'Expires (exp)',
      'jwt.iat': 'Issued (iat)',
      'jwt.nbf': 'Not before (nbf)',
      'jwt.note': 'Decoded only; the signature is not verified.',
      'jwt.unsigned': 'no signature section',
      'jwt.expired': 'Expired',
      'jwt.active': 'Not expired',
      'tool.diff.title': 'Text diff',
      'tool.diff.desc': 'Compare two texts line by line and copy the unified result.',
      'diff.left': 'Original',
      'diff.right': 'Changed',
      'diff.tooLarge': 'Too many lines to compare (about 1000 × 1000 max)',
      'diff.identical': 'No line differences',
      'diff.ignoreCase': 'Ignore case',
      'diff.ignoreWhitespace': 'Ignore whitespace',
    }

    const ZH = {
      'action.label': '开发工具箱',
      'action.title': '开发工具箱',
      'shortcut.label': '打开开发工具箱',
      'panel.title': 'zicode 开发工具箱',
      'panel.subtitle': '本地开发者小工具',
      'panel.search': '搜索工具',
      'panel.tools': '工具',
      'panel.close': '关闭',
      'panel.hotkeyHint': '默认快捷键，可在「设置 → 快捷键」中修改',
      'panel.toggle': '切换',
      'panel.local': '纯本地运行',
      'panel.noMatch': '没有匹配的工具',
      'panel.esc': '关闭',
      'menu.title': 'zicode 开发工具箱',
      'menu.all': '全部工具…',
      'menu.settings': '菜单设置…',
      'menu.about': '关于 zicode…',
      'menu.github': 'GitHub / Star…',
      'footer.site': 'www.zicode.com',
      'footer.wechat': '公众号',
      'footer.qrHint': '查看公众号二维码',
      'about.title': '关于 zicode',
      'about.desc': '这个工具箱的版本、官网与公众号。',
      'about.version': '版本',
      'about.website': '官网',
      'about.wechat': '微信公众号',
      'about.scan': '扫码关注「字与码」',
      'about.software': '软件模块',
      'about.note': '软件模块入口与 DSH 插件落地页将在这里上线。',
      'about.copyLink': '复制链接',
      'about.github': 'GitHub',
      'about.star': 'Star 这个项目',
      'about.starNote': '如果这个工具箱帮到你，欢迎在 GitHub 点个 Star。',
      'settings.title': '菜单设置',
      'settings.desc': '决定侧栏二级菜单里显示哪些工具、显示几个、按什么顺序。',
      'settings.sort': '排序方式',
      'settings.sortUsage': '常用优先',
      'settings.sortManual': '手动排序',
      'settings.visible': '二级菜单显示数量',
      'settings.hint': '常用优先按打开次数排序；次数相同按手动顺序。',
      'settings.order': '手动顺序',
      'settings.uses': '次',
      'settings.moveUp': '上移',
      'settings.moveDown': '下移',
      'settings.reset': '恢复默认',
      'common.copy': '复制',
      'common.copied': '已复制',
      'common.copyFailed': '复制失败',
      'common.clear': '清空',
      'common.generate': '生成',
      'common.encode': '编码',
      'common.decode': '解码',
      'common.swap': '作为输入',
      'common.emptyInput': '请先输入内容',
      'tool.ascii.title': 'ASCII 码表',
      'tool.ascii.desc': '查询 0–127 的十进制、十六进制、八进制与二进制码值，也可查看任意字符的码点。',
      'ascii.probe': '输入字符、码值或 0x41',
      'ascii.char': '字符',
      'ascii.control': '控制字符',
      'ascii.printable': '可打印',
      'ascii.unicode': 'Unicode',
      'ascii.dec': '十进制',
      'ascii.hex': '十六进制',
      'ascii.oct': '八进制',
      'ascii.bin': '二进制',
      'ascii.name': '名称',
      'ascii.codepoint': '码点',
      'ascii.copyHint': '点击行复制字符或转义值',
      'ascii.outside': '不在 ASCII 范围内，按 Unicode 码点显示。',
      'ascii.noMatch': '0–127 中没有匹配的码值',
      'tool.encode.title': '编码转换',
      'tool.encode.desc': '文本与 Base64、URL 编码、HTML 实体、Unicode 转义、UTF-8 十六进制互转。',
      'encode.input': '待转换文本',
      'encode.output': '转换结果',
      'encode.base64': 'Base64',
      'encode.url': 'URL',
      'encode.html': 'HTML 实体',
      'encode.unicode': 'Unicode 转义',
      'encode.hex': '十六进制（UTF-8）',
      'encode.invalidBase64': 'Base64 输入无效',
      'encode.invalidUrl': 'URL 编码输入无效',
      'encode.invalidHex': '十六进制需为两位一组，如 41 42',
      'encode.invalidUnicode': 'Unicode 转义无效',
      'encode.invalidHtml': 'HTML 实体输入无效',
      'encode.urlSafe': 'URL-safe（去掉 padding）',
      'tool.password.title': '密码生成',
      'tool.password.desc': '基于密码学随机数生成密码，并实时估算熵值。',
      'password.length': '长度',
      'password.upper': '大写 A–Z',
      'password.lower': '小写 a–z',
      'password.digits': '数字 0–9',
      'password.symbols': '符号',
      'password.ambiguous': '排除易混淆字符（Il1O0o）',
      'password.strength': '强度',
      'password.entropy': '熵值',
      'password.bits': '位',
      'password.weak': '弱',
      'password.medium': '中',
      'password.strong': '强',
      'password.veryStrong': '很强',
      'password.noSets': '至少选择一种字符集',
      'tool.json.title': 'JSON',
      'tool.json.desc': '格式化、压缩或校验 JSON，出错时给出行列位置。',
      'json.input': '粘贴 JSON',
      'json.output': '格式化结果',
      'json.indent': '缩进',
      'json.spaces2': '2 空格',
      'json.spaces4': '4 空格',
      'json.tab': 'Tab',
      'json.sort': '键排序',
      'json.format': '格式化',
      'json.minify': '压缩',
      'json.validate': '校验',
      'json.valid': 'JSON 有效',
      'json.invalid': 'JSON 无效',
      'json.chars': '字符',
      'json.line': '行',
      'json.column': '列',
      'tool.color.title': '颜色',
      'tool.color.desc': 'HEX、RGB、HSL 互转，带实时色块预览。',
      'color.input': 'HEX、rgb() 或 hsl()',
      'color.invalid': '无法识别的颜色',
      'color.pick': '取色',
      'color.preview': '预览',
      'tool.timestamp.title': '时间戳',
      'tool.timestamp.desc': 'Unix 时间戳与本地、UTC 时间互转。',
      'timestamp.now': '现在',
      'timestamp.seconds': '秒',
      'timestamp.millis': '毫秒',
      'timestamp.local': '本地时间',
      'timestamp.utc': 'UTC',
      'timestamp.iso': 'ISO 8601',
      'timestamp.tsInput': '时间戳（秒或毫秒）',
      'timestamp.dateInput': '日期时间',
      'timestamp.relative': '相对现在',
      'timestamp.invalid': '时间戳无效',
      'tool.uuid.title': 'UUID',
      'tool.uuid.desc': '批量生成随机 v4 UUID。',
      'uuid.count': '数量',
      'uuid.upper': '大写',
      'uuid.noDash': '去掉短横线',
      'uuid.copyAll': '复制全部',
      'tool.hash.title': '哈希',
      'tool.hash.desc': '计算文本的 SHA-1、SHA-256、SHA-384、SHA-512 摘要。',
      'hash.input': '待哈希文本',
      'hash.hex': '十六进制',
      'hash.base64': 'Base64',
      'hash.computing': '计算中…',
      'hash.unsupported': '当前页面不支持 Web Crypto',
      'hash.empty': '输入文本后自动计算摘要',
      'tool.regex.title': '正则测试',
      'tool.regex.desc': '用正则匹配文本，查看捕获组，并预览替换结果。',
      'regex.pattern': '正则表达式',
      'regex.flags': '标志',
      'regex.flag.g': '全局匹配 (g)',
      'regex.flag.i': '忽略大小写 (i)',
      'regex.flag.m': '多行 (m)',
      'regex.flag.s': '点号匹配换行 (s)',
      'regex.flag.u': 'Unicode (u)',
      'regex.text': '文本',
      'regex.matches': '处匹配',
      'regex.replacement': '替换为（$&、$1）',
      'regex.result': '替换结果',
      'tool.cron.title': 'Cron 表达式',
      'tool.cron.desc': '解析五段式 Cron，并预览接下来几次运行时间。',
      'cron.expression': 'Cron 表达式',
      'cron.next': '接下来 5 次',
      'cron.invalid': '五段式 Cron 表达式无效',
      'cron.minute': '分钟',
      'cron.hour': '小时',
      'cron.day': '日',
      'cron.month': '月',
      'cron.weekday': '星期',
      'cron.empty': '点击「接下来 5 次」计算运行时间。',
      'cron.localHint': '时间按本地时区计算。',
      'tool.url.title': 'URL 解析',
      'tool.url.desc': '拆分 URL 各部分，并解码查询参数。',
      'url.input': 'URL',
      'url.invalid': '请输入带协议头的完整 URL，例如 https://…',
      'url.origin': '源',
      'url.protocol': '协议',
      'url.host': '主机',
      'url.port': '端口',
      'url.path': '路径',
      'url.search': '查询串',
      'url.hash': '锚点',
      'url.key': '参数',
      'url.value': '值',
      'url.noParams': '没有查询参数',
      'url.copyJson': '复制为 JSON',
      'tool.text.title': '文本工具',
      'tool.text.desc': '统计字符、字节、词、行与中文数，并做大小写/命名转换。',
      'text.input': '文本',
      'text.chars': '字符',
      'text.bytes': '字节',
      'text.words': '词',
      'text.lines': '行',
      'text.cjk': '中文',
      'text.upper': '全大写',
      'text.lower': '全小写',
      'text.title': '首字母大写',
      'text.camel': 'camelCase',
      'text.pascal': 'PascalCase',
      'text.snake': 'snake_case',
      'text.kebab': 'kebab-case',
      'text.constant': 'CONSTANT_CASE',
      'text.trim': '压缩空白',
      'tool.jwt.title': 'JWT 解码',
      'tool.jwt.desc': '解码 JWT 的 header 与 payload，显示时间声明；不校验签名。',
      'jwt.input': 'JWT',
      'jwt.invalid': 'JWT 无效，或 payload 不是 JSON',
      'jwt.header': 'Header',
      'jwt.payload': 'Payload',
      'jwt.exp': '过期时间 (exp)',
      'jwt.iat': '签发时间 (iat)',
      'jwt.nbf': '生效时间 (nbf)',
      'jwt.note': '仅解码，不校验签名。',
      'jwt.unsigned': '没有签名段',
      'jwt.expired': '已过期',
      'jwt.active': '未过期',
      'tool.diff.title': '文本对比',
      'tool.diff.desc': '逐行比较两段文本，并复制统一格式结果。',
      'diff.left': '原文',
      'diff.right': '新文',
      'diff.tooLarge': '行数过多，最多比较约 1000 × 1000 行',
      'diff.identical': '没有行差异',
      'diff.ignoreCase': '忽略大小写',
      'diff.ignoreWhitespace': '忽略空白',
    }

    /* ---------------------------------------------------------------- store */

    const state = { open: false, tab: 'json', filter: '' }
    const listeners = new Set()
    const emit = () => { for (const listener of listeners) listener() }
    const patch = (next) => { Object.assign(state, next); emit() }
    const subscribe = (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    }
    const useStore = (select) => useSyncExternalStore(subscribe, () => select(state))
    const setTab = (tab) => {
      patch({ tab })
      if (tab !== SETTINGS_ID) recordUsage(tab)
    }
    const setFilter = (filter) => patch({ filter })
    let returnFocus = null
    const openToolbox = (tab) => {
      const active = document.activeElement
      returnFocus = active !== null && active !== undefined && active !== document.body ? active : null
      if (tab === undefined) {
        patch({ open: true })
        return
      }
      patch({ open: true, tab })
      if (tab !== SETTINGS_ID) recordUsage(tab)
    }
    const closeToolbox = () => patch({ open: false })
    const toggleToolbox = () => { if (state.open) closeToolbox(); else openToolbox() }

    /* -------------------------------------------------------------- helpers */

    const COPY_ERROR = 'copyFailed'

    function writeClipboard(text) {
      if (text === undefined || text === null || text === '') return Promise.resolve(false)
      if (navigator.clipboard === undefined || typeof navigator.clipboard.writeText !== 'function') {
        return Promise.resolve(false)
      }
      return navigator.clipboard.writeText(String(text)).then(() => true, () => false)
    }

    function openExternal(url) {
      try {
        window.open(url, '_blank', 'noopener,noreferrer')
      } catch (error) {
        /* the host may block new windows; the URL stays visible and copyable */
      }
    }

    function useCopy() {
      const [copied, setCopied] = useState(null)
      const [failed, setFailed] = useState(null)
      const timer = useRef(0)
      const copy = useCallback((id, text) => {
        void writeClipboard(text).then((ok) => {
          if (ok) { setCopied(id); setFailed(null) } else { setCopied(null); setFailed(id) }
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => { setCopied(null); setFailed(null) }, 1500)
        })
      }, [])
      useEffect(() => () => { window.clearTimeout(timer.current) }, [])
      return { copied, failed, copy }
    }

    function CopyButton({ id, text, copyState, t, primary, label }) {
      const isCopied = copyState.copied === id
      const isFailed = copyState.failed === id
      return h('button', {
        type: 'button',
        className: primary ? 'zct-btn zct-btn-primary' : 'zct-btn',
        onClick: () => { copyState.copy(id, text) },
        disabled: text === undefined || text === null || text === '',
      }, isFailed ? t('common.copyFailed') : isCopied ? t('common.copied') : (label === undefined ? t('common.copy') : label))
    }

    function Btn({ children, primary, onClick, disabled, title, type }) {
      return h('button', {
        type: type || 'button',
        className: primary ? 'zct-btn zct-btn-primary' : 'zct-btn',
        onClick,
        disabled,
        title,
      }, children)
    }

    function Field({ label, hint, children }) {
      return h('div', { className: 'zct-field' },
        h('span', { className: 'zct-label' }, label),
        children,
        hint !== undefined ? h('span', { className: 'zct-hint' }, hint) : null,
      )
    }

    function Input(props) {
      return h('input', Object.assign({}, props, {
        className: 'zct-input' + (props.className === undefined ? '' : ' ' + props.className),
      }))
    }

    function TextArea(props) {
      const extra = props.mono === false ? '' : ' zct-mono'
      const className = 'zct-textarea' + extra + (props.className === undefined ? '' : ' ' + props.className)
      return h('textarea', Object.assign({}, props, { className }))
    }

    function Segmented({ options, value, onChange }) {
      return h('div', { className: 'zct-segmented', role: 'group' },
        options.map(option => h('button', {
          key: option.id,
          type: 'button',
          className: option.id === value ? 'zct-chip zct-chip-active' : 'zct-chip',
          'aria-pressed': option.id === value,
          onClick: () => { onChange(option.id) },
        }, option.label)))
    }

    function Switch({ checked, onChange, label }) {
      return h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': checked,
        className: 'zct-switch-row',
        onClick: () => { onChange(!checked) },
      },
      h('span', { className: checked ? 'zct-switch zct-switch-on' : 'zct-switch', 'aria-hidden': 'true' },
        h('span', { className: 'zct-knob' })),
      h('span', { className: 'zct-switch-label' }, label))
    }

    function CodeBlock({ text }) {
      return h('pre', { className: 'zct-code' }, text)
    }

    function ErrorLine({ children }) {
      if (children === undefined || children === null || children === '') return null
      return h('p', { className: 'zct-error', role: 'alert' }, children)
    }

    function HintLine({ children }) {
      if (children === undefined || children === null || children === '') return null
      return h('p', { className: 'zct-hint-line' }, children)
    }

    /* ---------------------------------------------------------------- icons */

    function icon(children) {
      return h('svg', {
        width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': 'true', focusable: 'false',
      }, children)
    }

    const ToolboxIcon = ({ size = 18 }) => h('svg', {
      width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
      'aria-hidden': 'true', focusable: 'false',
    },
    h('rect', { key: 'b', x: 3, y: 8, width: 18, height: 11, rx: 2.6 }),
    h('path', { key: 'h', d: 'M9 8V6.6A2.6 2.6 0 0 1 11.6 4h0.8A2.6 2.6 0 0 1 15 6.6V8' }),
    h('path', { key: 'l', d: 'M3 12.4h18' }),
    h('path', { key: 'k', d: 'M10.6 12.4v1.7h2.8v-1.7' }))

    const AsciiIcon = () => icon([
      h('path', { key: 'a', d: 'M9 7 5 12l4 5' }),
      h('path', { key: 'b', d: 'm15 7 4 5-4 5' }),
    ])
    const EncodeIcon = () => icon([
      h('path', { key: 'a', d: 'M4 9h12m-3-3 3 3-3 3' }),
      h('path', { key: 'b', d: 'M20 15H8m3-3-3 3 3 3' }),
    ])
    const PasswordIcon = () => icon([
      h('circle', { key: 'c', cx: 8, cy: 12, r: 3.2 }),
      h('path', { key: 's', d: 'M11.2 12H20' }),
      h('path', { key: 't', d: 'M16.6 12v3.2' }),
      h('path', { key: 'u', d: 'M19.4 12v2.2' }),
    ])
    const JsonIcon = () => icon([
      h('path', { key: 'l', d: 'M9 4c-2 0-3 1-3 2.8v2.4c0 1-.6 1.7-1.6 1.8 1 .1 1.6.8 1.6 1.8v2.4C6 17 7 18 9 18' }),
      h('path', { key: 'r', d: 'M15 4c2 0 3 1 3 2.8v2.4c0 1 .6 1.7 1.6 1.8-1 .1-1.6.8-1.6 1.8v2.4c0 1.8-1 2.8-3 2.8' }),
    ])
    const ColorIcon = () => icon([
      h('path', { key: 'd', d: 'M12 3.4c3 3.7 5.6 6.4 5.6 9.1a5.6 5.6 0 0 1-11.2 0c0-2.7 2.6-5.4 5.6-9.1z' }),
    ])
    const ClockIcon = () => icon([
      h('circle', { key: 'c', cx: 12, cy: 12, r: 8 }),
      h('path', { key: 'h', d: 'M12 7.4V12l3 2' }),
    ])
    const UuidIcon = () => icon([
      h('path', { key: 'a', d: 'M9.5 4 7.5 20' }),
      h('path', { key: 'b', d: 'M16.5 4l-2 16' }),
      h('path', { key: 'c', d: 'M4.5 9h15' }),
      h('path', { key: 'd', d: 'M3.5 15h15' }),
    ])
    const HashIcon = () => icon([
      h('path', { key: 's', d: 'M12 3.2 19 6v5.9c0 4.1-2.8 7.3-7 8.9-4.2-1.6-7-4.8-7-8.9V6z' }),
      h('path', { key: 'c', d: 'm9.2 12 2 2 3.6-3.8' }),
    ])
    const RegexIcon = () => icon([
      h('circle', { key: 'c', cx: 10, cy: 10, r: 5.2 }),
      h('path', { key: 'h', d: 'm14 14 5.5 5.5' }),
      h('path', { key: 's', d: 'M8 9.5h4M10 7.5v4' }),
    ])
    const CronIcon = () => icon([
      h('rect', { key: 'r', x: 3.5, y: 4.5, width: 17, height: 16, rx: 2.6 }),
      h('path', { key: 'h', d: 'M3.5 9.5h17' }),
      h('path', { key: 'a', d: 'M8 3v3' }),
      h('path', { key: 'b', d: 'M16 3v3' }),
      h('path', { key: 'c', d: 'M8 13h2' }),
      h('path', { key: 'd', d: 'M14 13h2' }),
      h('path', { key: 'e', d: 'M8 17h2' }),
    ])
    const UrlIcon = () => icon([
      h('path', { key: 'a', d: 'M10.2 13.8a5 5 0 0 0 7.1 0l1.4-1.4a5 5 0 0 0-7.1-7.1L10.2 6.7' }),
      h('path', { key: 'b', d: 'M13.8 10.2a5 5 0 0 0-7.1 0l-1.4 1.4a5 5 0 0 0 7.1 7.1l1.4-1.4' }),
    ])
    const TextIcon = () => icon([
      h('path', { key: 'a', d: 'M5 6h14' }),
      h('path', { key: 'b', d: 'M12 6v12' }),
      h('path', { key: 'c', d: 'M9 18h6' }),
    ])
    const JwtIcon = () => icon([
      h('path', { key: 'a', d: 'M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2' }),
      h('path', { key: 'b', d: 'M16 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2' }),
      h('path', { key: 'c', d: 'M12 8v8' }),
      h('path', { key: 'd', d: 'M9 12h6' }),
    ])
    const DiffIcon = () => icon([
      h('path', { key: 'a', d: 'M4 6h7' }),
      h('path', { key: 'b', d: 'M4 12h7' }),
      h('path', { key: 'c', d: 'M4 18h7' }),
      h('path', { key: 'd', d: 'M17 5v6' }),
      h('path', { key: 'e', d: 'M14 8h6' }),
      h('path', { key: 'f', d: 'M14 17h6' }),
    ])
    const SettingsIcon = () => icon([
      h('circle', { key: 'c', cx: 12, cy: 12, r: 3 }),
      h('path', { key: 'a', d: 'M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z' }),
    ])
    const InfoIcon = () => icon([
      h('circle', { key: 'c', cx: 12, cy: 12, r: 8.6 }),
      h('path', { key: 'i', d: 'M12 11v5' }),
      h('path', { key: 'd', d: 'M12 7.8h.01' }),
    ])
    const GridIcon = () => icon([
      h('rect', { key: 'a', x: 4, y: 4, width: 6.5, height: 6.5, rx: 1.5 }),
      h('rect', { key: 'b', x: 13.5, y: 4, width: 6.5, height: 6.5, rx: 1.5 }),
      h('rect', { key: 'c', x: 4, y: 13.5, width: 6.5, height: 6.5, rx: 1.5 }),
      h('rect', { key: 'd', x: 13.5, y: 13.5, width: 6.5, height: 6.5, rx: 1.5 }),
    ])
    const GitHubIcon = () => icon([
      h('circle', { key: 'a', cx: 6.5, cy: 6, r: 2.2 }),
      h('circle', { key: 'b', cx: 6.5, cy: 18, r: 2.2 }),
      h('circle', { key: 'c', cx: 17.5, cy: 8, r: 2.2 }),
      h('path', { key: 'd', d: 'M6.5 8.2v7.6' }),
      h('path', { key: 'e', d: 'M17.5 10.2c0 3.6-2.9 4.6-6 4.8' }),
    ])
    const StarIcon = () => icon([
      h('path', { key: 's', d: 'm12 3.7 2.6 5.2 5.8.9-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.9z' }),
    ])

    /* ----------------------------------------------------------------- ascii */

    const CONTROL_NAMES = [
      'NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL',
      'BS', 'HT', 'LF', 'VT', 'FF', 'CR', 'SO', 'SI',
      'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB',
      'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US',
    ]

    const ASCII_ROWS = Array.from({ length: 128 }, (_, code) => {
      const char = code >= 32 && code < 127 ? String.fromCharCode(code) : ''
      const name = code < 32 ? CONTROL_NAMES[code] : code === 32 ? 'SP' : code === 127 ? 'DEL' : char
      return {
        code,
        dec: String(code),
        hex: code.toString(16).toUpperCase().padStart(2, '0'),
        oct: code.toString(8).padStart(3, '0'),
        bin: code.toString(2).padStart(8, '0'),
        char: char === '' ? (code === 32 ? '␠' : '·') : char,
        raw: char,
        name,
      }
    })

    function rowValue(row) {
      if (row.raw !== '') return row.raw
      return '\\x' + row.hex.toLowerCase()
    }

    function describeProbe(query) {
      const trimmed = query.trim()
      if (trimmed === '') return null
      let code
      if (/^0x[0-9a-f]+$/i.test(trimmed)) code = Number.parseInt(trimmed.slice(2), 16)
      else if (/^\d+$/.test(trimmed)) code = Number.parseInt(trimmed, 10)
      if (code !== undefined && Number.isFinite(code) && code >= 0 && code <= 0x10ffff) {
        return { kind: 'single', code, chars: [String.fromCodePoint(code)] }
      }
      const chars = Array.from(trimmed)
      if (chars.length === 1) return { kind: 'single', code: chars[0].codePointAt(0), chars: [chars[0]] }
      return { kind: 'list', chars: chars.slice(0, 64).map(char => ({ char, code: char.codePointAt(0) })) }
    }

    function AsciiTool({ t }) {
      const [query, setQuery] = useState('')
      const [focusCode, setFocusCode] = useState(0)
      const copyState = useCopy()
      const probe = useMemo(() => describeProbe(query), [query])
      const rows = useMemo(() => {
        const trimmed = query.trim()
        if (trimmed === '') return ASCII_ROWS
        const lower = trimmed.toLowerCase()
        if (/^\d+$/.test(trimmed)) return ASCII_ROWS.filter(row => row.dec === trimmed)
        if (/^0x[0-9a-f]+$/i.test(trimmed)) {
          const hex = trimmed.slice(2).toUpperCase()
          return ASCII_ROWS.filter(row => row.hex === hex)
        }
        if (Array.from(trimmed).length === 1) return ASCII_ROWS.filter(row => row.raw === trimmed)
        return ASCII_ROWS.filter(row => row.name !== row.raw && row.name.toLowerCase().startsWith(lower))
      }, [query])

      const activeCode = rows.some(row => row.code === focusCode)
        ? focusCode
        : rows.length > 0 ? rows[0].code : -1

      const moveFocus = (row) => {
        if (row === undefined) return
        setFocusCode(row.code)
        window.requestAnimationFrame(() => {
          const node = document.getElementById('zct-ascii-row-' + row.code)
          if (node !== null) node.focus()
        })
      }

      const onRowKeyDown = (event, row, index) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          copyState.copy('row-' + row.code, rowValue(row))
          return
        }
        if (event.key === 'ArrowDown') { event.preventDefault(); moveFocus(rows[Math.min(index + 1, rows.length - 1)]) }
        if (event.key === 'ArrowUp') { event.preventDefault(); moveFocus(rows[Math.max(index - 1, 0)]) }
        if (event.key === 'Home') { event.preventDefault(); moveFocus(rows[0]) }
        if (event.key === 'End') { event.preventDefault(); moveFocus(rows[rows.length - 1]) }
      }

      const single = probe !== null && probe.kind === 'single' ? probe.chars[0] : ''
      const singleCode = probe !== null && probe.kind === 'single' ? probe.code : 0
      const inAscii = singleCode >= 0 && singleCode <= 127

      return h(Fragment, null,
        h(Field, { label: t('ascii.probe') },
          h(Input, {
            value: query,
            onChange: (event) => { setQuery(event.target.value) },
            placeholder: 'A / 65 / 0x41',
            spellCheck: false,
            autoComplete: 'off',
          })),

        probe !== null && h('div', { className: 'zct-card' },
          probe.kind === 'single'
            ? h(Fragment, null,
              h('div', { className: 'zct-glyph' }, inAscii ? ASCII_ROWS[singleCode].char : single),
              h('dl', { className: 'zct-values' },
                h('div', null, h('dt', null, t('ascii.dec')), h('dd', null, String(singleCode))),
                h('div', null, h('dt', null, t('ascii.hex')), h('dd', null, '0x' + singleCode.toString(16).toUpperCase())),
                h('div', null, h('dt', null, t('ascii.oct')), h('dd', null, '0o' + singleCode.toString(8))),
                h('div', null, h('dt', null, t('ascii.bin')), h('dd', null, singleCode.toString(2))),
                h('div', null, h('dt', null, t('ascii.codepoint')), h('dd', null, 'U+' + singleCode.toString(16).toUpperCase().padStart(4, '0'))),
                h('div', null, h('dt', null, t('ascii.name')), h('dd', null, describeName(singleCode, t))),
              ),
              h('div', { className: 'zct-card-actions' },
                h(CopyButton, { id: 'probe-char', text: single, copyState, t })))
            : h('div', { className: 'zct-chips' },
              probe.chars.map((entry, index) =>
                h('button', {
                  key: index + ':' + entry.code,
                  type: 'button',
                  className: 'zct-chip',
                  onClick: () => { copyState.copy('probe-' + entry.code, entry.char) },
                  title: 'U+' + entry.code.toString(16).toUpperCase(),
                },
                h('span', { className: 'zct-chip-glyph' }, entry.char),
                h('span', { className: 'zct-chip-code' }, 'U+' + entry.code.toString(16).toUpperCase().padStart(4, '0')))))),
        probe !== null && probe.kind === 'single' && !inAscii
          ? h(HintLine, null, t('ascii.outside'))
          : null,

        rows.length === 0 ? h(HintLine, null, t('ascii.noMatch')) : null,
        h('div', { className: 'zct-table-wrap' },
          h('table', { className: 'zct-table' },
            h('thead', null,
              h('tr', null,
                h('th', { scope: 'col' }, t('ascii.dec')),
                h('th', { scope: 'col' }, t('ascii.hex')),
                h('th', { scope: 'col' }, t('ascii.oct')),
                h('th', { scope: 'col' }, t('ascii.bin')),
                h('th', { scope: 'col' }, t('ascii.char')),
                h('th', { scope: 'col' }, t('ascii.name')))),
            h('tbody', null, rows.map((row, index) => h('tr', {
              key: row.code,
              id: 'zct-ascii-row-' + row.code,
              className: 'zct-row',
              tabIndex: row.code === activeCode ? 0 : -1,
              title: t('ascii.copyHint'),
              onFocus: () => { if (focusCode !== row.code) setFocusCode(row.code) },
              onClick: () => { copyState.copy('row-' + row.code, rowValue(row)) },
              onKeyDown: (event) => { onRowKeyDown(event, row, index) },
            },
            h('td', null, row.dec),
            h('td', null, row.hex),
            h('td', null, row.oct),
            h('td', null, row.bin),
            h('td', { className: 'zct-char' }, row.char),
            h('td', { className: 'zct-dim' }, row.name)))))),

        copyState.copied !== null
          ? h('p', { className: 'zct-hint-line', role: 'status' }, t('common.copied'))
          : null,
      )
    }

    function describeName(code, t) {
      if (code < 32) return CONTROL_NAMES[code]
      if (code === 32) return 'SP'
      if (code === 127) return 'DEL'
      if (code >= 33 && code < 127) return t('ascii.printable')
      return t('ascii.unicode')
    }

    /* -------------------------------------------------------------- encoding */

    const HTML_ENTITIES = {
      amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
      copy: '©', reg: '®', trade: '™', hellip: '…', mdash: '—', ndash: '–',
      laquo: '«', raquo: '»', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’',
      times: '×', divide: '÷', deg: '°', plusmn: '±', micro: 'µ',
      para: '¶', sect: '§', euro: '€', pound: '£', yen: '¥', cent: '¢',
    }

    function utf8ToBase64(text) {
      const bytes = new TextEncoder().encode(text)
      let binary = ''
      const chunk = 0x8000
      for (let index = 0; index < bytes.length; index += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunk))
      }
      return btoa(binary)
    }

    function base64ToUtf8(text) {
      const normalized = text.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
      const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4)
      const binary = atob(padded)
      const bytes = new Uint8Array(binary.length)
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    }

    function htmlEncode(text) {
      return text.replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      })[char])
    }

    function htmlDecode(text) {
      return text.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body) => {
        if (body[0] === '#') {
          const code = body[1] === 'x' || body[1] === 'X'
            ? Number.parseInt(body.slice(2), 16)
            : Number.parseInt(body.slice(1), 10)
          return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match
        }
        const named = HTML_ENTITIES[body.toLowerCase()]
        return named === undefined ? match : named
      })
    }

    function unicodeEncode(text) {
      return Array.from(text).map((char) => {
        const code = char.codePointAt(0)
        if (code > 0xffff) return '\\u{' + code.toString(16).toUpperCase() + '}'
        return '\\u' + code.toString(16).toUpperCase().padStart(4, '0')
      }).join('')
    }

    function unicodeDecode(text) {
      if (/\\u(?![0-9a-fA-F]{4}|\{)/.test(text)) throw new Error('invalid')
      return text.replace(/\\u\{([0-9a-fA-F]{1,6})\}|\\u([0-9a-fA-F]{4})/g, (match, braced, plain) => {
        const code = Number.parseInt(braced === undefined ? plain : braced, 16)
        if (!Number.isFinite(code) || code > 0x10ffff) throw new Error('invalid')
        return String.fromCodePoint(code)
      })
    }

    function hexEncode(text) {
      const bytes = new TextEncoder().encode(text)
      return Array.from(bytes, byte => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ')
    }

    function hexDecode(text) {
      const cleaned = text.replace(/0x/gi, '').replace(/[\s,;:-]+/g, '')
      if (cleaned === '' || !/^[0-9a-fA-F]+$/.test(cleaned) || cleaned.length % 2 !== 0) throw new Error('invalid')
      const bytes = new Uint8Array(cleaned.length / 2)
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Number.parseInt(cleaned.slice(index * 2, index * 2 + 2), 16)
      }
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    }

    function convertEncoding(mode, direction, text, urlSafe) {
      if (text === '') return { error: 'empty' }
      try {
        if (mode === 'base64') {
          if (direction === 'encode') {
            const encoded = utf8ToBase64(text)
            return { value: urlSafe ? encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '') : encoded }
          }
          return { value: base64ToUtf8(text) }
        }
        if (mode === 'url') {
          return { value: direction === 'encode' ? encodeURIComponent(text) : decodeURIComponent(text) }
        }
        if (mode === 'html') return { value: direction === 'encode' ? htmlEncode(text) : htmlDecode(text) }
        if (mode === 'unicode') return { value: direction === 'encode' ? unicodeEncode(text) : unicodeDecode(text) }
        if (mode === 'hex') return { value: direction === 'encode' ? hexEncode(text) : hexDecode(text) }
      } catch (error) {
        return { error: mode }
      }
      return { error: 'empty' }
    }

    function EncodingTool({ t }) {
      const [mode, setMode] = useState('base64')
      const [input, setInput] = useState('')
      const [output, setOutput] = useState('')
      const [errorMode, setErrorMode] = useState(null)
      const [urlSafe, setUrlSafe] = useState(false)
      const copyState = useCopy()

      const run = (direction) => {
        const result = convertEncoding(mode, direction, input, urlSafe)
        if (result.error !== undefined) {
          setOutput('')
          setErrorMode(result.error === 'empty' ? 'empty' : mode)
          return
        }
        setErrorMode(null)
        setOutput(result.value)
      }

      const errorText = errorMode === null || errorMode === 'empty'
        ? (errorMode === 'empty' ? t('common.emptyInput') : '')
        : t('encode.invalid' + errorMode.charAt(0).toUpperCase() + errorMode.slice(1))

      return h(Fragment, null,
        h(Segmented, {
          options: ['base64', 'url', 'html', 'unicode', 'hex'].map(id => ({ id, label: t('encode.' + id) })),
          value: mode,
          onChange: (next) => { setMode(next); setOutput(''); setErrorMode(null) },
        }),
        mode === 'base64'
          ? h(Switch, {
            checked: urlSafe,
            onChange: (next) => { setUrlSafe(next); setOutput(''); setErrorMode(null) },
            label: t('encode.urlSafe'),
          })
          : null,
        h(Field, { label: t('encode.input') },
          h(TextArea, {
            value: input,
            rows: 6,
            placeholder: t('encode.input'),
            spellCheck: false,
            onChange: (event) => { setInput(event.target.value); setOutput(''); setErrorMode(null) },
          })),
        h('div', { className: 'zct-actions' },
          h(Btn, { primary: true, onClick: () => { run('encode') } }, t('common.encode')),
          h(Btn, { onClick: () => { run('decode') } }, t('common.decode')),
          h(Btn, { onClick: () => { setInput(output); setOutput(''); setErrorMode(null) }, disabled: output === '' }, t('common.swap')),
          h(Btn, { onClick: () => { setInput(''); setOutput(''); setErrorMode(null) } }, t('common.clear'))),
        h(ErrorLine, null, errorText),
        h(Field, { label: t('encode.output') },
          h(TextArea, {
            value: output,
            rows: 6,
            readOnly: true,
            placeholder: t('encode.output'),
            spellCheck: false,
          })),
        h('div', { className: 'zct-actions' }, h(CopyButton, { id: 'encoded', text: output, copyState, t })))
    }

    /* -------------------------------------------------------------- password */

    const POOLS = {
      upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lower: 'abcdefghijklmnopqrstuvwxyz',
      digits: '0123456789',
      symbols: '!@#$%^&*()-_=+[]{};:,.?/|~',
    }
    const AMBIGUOUS = 'Il1O0o'

    function randomInt(bound) {
      if (bound <= 0) return 0
      const buffer = new Uint32Array(1)
      const limit = Math.floor(4294967296 / bound) * bound
      for (;;) {
        crypto.getRandomValues(buffer)
        if (buffer[0] < limit) return buffer[0] % bound
      }
    }

    function buildPassword(options) {
      const pools = []
      for (const key of ['upper', 'lower', 'digits', 'symbols']) {
        if (!options[key]) continue
        const pool = options.ambiguous
          ? Array.from(POOLS[key]).filter(char => AMBIGUOUS.indexOf(char) === -1).join('')
          : POOLS[key]
        if (pool !== '') pools.push(pool)
      }
      if (pools.length === 0) return { password: '', alphabet: 0 }
      const alphabet = pools.join('')
      const chars = pools.map(pool => pool[randomInt(pool.length)])
      while (chars.length < options.length) chars.push(alphabet[randomInt(alphabet.length)])
      for (let index = chars.length - 1; index > 0; index -= 1) {
        const swap = randomInt(index + 1)
        const tmp = chars[index]
        chars[index] = chars[swap]
        chars[swap] = tmp
      }
      return { password: chars.slice(0, options.length).join(''), alphabet: alphabet.length }
    }

    function strengthOf(bits) {
      if (bits < 40) return 0
      if (bits < 60) return 1
      if (bits < 80) return 2
      return 3
    }

    function PasswordTool({ t }) {
      const [length, setLength] = useState(20)
      const [options, setOptions] = useState({ upper: true, lower: true, digits: true, symbols: true, ambiguous: false })
      const [nonce, setNonce] = useState(0)
      const copyState = useCopy()

      const generated = useMemo(() => buildPassword({ length, ...options }), [length, options, nonce])
      const bits = generated.alphabet > 0 ? length * Math.log2(generated.alphabet) : 0
      const level = strengthOf(bits)
      const levelLabel = [t('password.weak'), t('password.medium'), t('password.strong'), t('password.veryStrong')][level]

      const toggle = (key) => {
        setOptions((current) => {
          const next = { ...current, [key]: !current[key] }
          if (!next.upper && !next.lower && !next.digits && !next.symbols) return current
          return next
        })
      }

      return h(Fragment, null,
        h('div', { className: 'zct-password-card' },
          h('code', { className: 'zct-password' }, generated.password === '' ? t('password.noSets') : generated.password),
          h('div', { className: 'zct-actions' },
            h(CopyButton, { id: 'password', text: generated.password, copyState, t }),
            h(Btn, { primary: true, onClick: () => { setNonce(nonce + 1) } }, t('common.generate')))),
        h('div', { className: 'zct-strength' },
          h('span', { className: 'zct-strength-bars', 'aria-hidden': 'true' },
            [0, 1, 2, 3].map(index => h('span', {
              key: index,
              className: index <= level && generated.password !== '' ? 'zct-bar zct-bar-on zct-level-' + level : 'zct-bar',
            }))),
          h('span', { className: 'zct-strength-text' }, t('password.strength') + ': ' + levelLabel + ' · ' + t('password.entropy') + ' ' + Math.round(bits) + ' ' + t('password.bits'))),
        h(Field, { label: t('password.length') + ': ' + length },
          h('input', {
            type: 'range',
            min: 4,
            max: 64,
            step: 1,
            value: length,
            className: 'zct-range',
            onChange: (event) => { setLength(Number(event.target.value)) },
          })),
        h('div', { className: 'zct-grid2' },
          h(Switch, { checked: options.upper, onChange: () => { toggle('upper') }, label: t('password.upper') }),
          h(Switch, { checked: options.lower, onChange: () => { toggle('lower') }, label: t('password.lower') }),
          h(Switch, { checked: options.digits, onChange: () => { toggle('digits') }, label: t('password.digits') }),
          h(Switch, { checked: options.symbols, onChange: () => { toggle('symbols') }, label: t('password.symbols') }),
          h(Switch, { checked: options.ambiguous, onChange: () => { toggle('ambiguous') }, label: t('password.ambiguous') })))
    }

    /* ------------------------------------------------------------------ json */

    function sortDeep(value) {
      if (Array.isArray(value)) return value.map(sortDeep)
      if (value !== null && typeof value === 'object') {
        const sorted = {}
        for (const key of Object.keys(value).sort()) sorted[key] = sortDeep(value[key])
        return sorted
      }
      return value
    }

    function describeJsonError(error, text) {
      const message = error instanceof Error ? error.message : String(error)
      const positionMatch = /position (\d+)/i.exec(message)
      let position = positionMatch === null ? null : Number(positionMatch[1])
      if (position === null) {
        const lineColumn = /line (\d+) column (\d+)/i.exec(message)
        if (lineColumn !== null) {
          const lines = text.split('\n')
          const line = Math.min(Number(lineColumn[1]), lines.length)
          let offset = 0
          for (let index = 0; index < line - 1; index += 1) offset += lines[index].length + 1
          position = offset + Number(lineColumn[2]) - 1
        }
      }
      if (position === null || position < 0) return { message }
      const before = text.slice(0, position)
      const line = before.split('\n').length
      const column = position - before.lastIndexOf('\n')
      return { message, line, column }
    }

    function JsonTool({ t }) {
      const [input, setInput] = useState('')
      const [output, setOutput] = useState('')
      const [error, setError] = useState('')
      const [status, setStatus] = useState('')
      const [indent, setIndent] = useState('2')
      const [sortKeys, setSortKeys] = useState(false)
      const copyState = useCopy()

      const run = (kind) => {
        if (input.trim() === '') {
          setOutput('')
          setStatus('')
          setError(t('common.emptyInput'))
          return
        }
        try {
          const parsed = JSON.parse(input)
          setError('')
          if (kind === 'validate') {
            setStatus(t('json.valid') + ' · ' + input.length + ' ' + t('json.chars'))
            return
          }
          setStatus('')
          const value = sortKeys ? sortDeep(parsed) : parsed
          const pad = indent === 'tab' ? '\t' : Number(indent)
          setOutput(kind === 'minify' ? JSON.stringify(value) : JSON.stringify(value, null, pad))
        } catch (parseError) {
          setOutput('')
          setStatus('')
          const detail = describeJsonError(parseError, input)
          const position = detail.line === undefined
            ? ''
            : ' (' + t('json.line') + ' ' + detail.line + ', ' + t('json.column') + ' ' + detail.column + ')'
          setError(t('json.invalid') + ': ' + detail.message + position)
        }
      }

      return h(Fragment, null,
        h(Field, { label: t('json.input') },
          h(TextArea, {
            value: input,
            rows: 8,
            placeholder: '{ "hello": "world" }',
            spellCheck: false,
            onChange: (event) => { setInput(event.target.value); setOutput(''); setError(''); setStatus('') },
          })),
        h('div', { className: 'zct-actions' },
          h(Btn, { primary: true, onClick: () => { run('format') } }, t('json.format')),
          h(Btn, { onClick: () => { run('minify') } }, t('json.minify')),
          h(Btn, { onClick: () => { run('validate') } }, t('json.validate')),
          h(Btn, { onClick: () => { setInput(''); setOutput(''); setError(''); setStatus('') } }, t('common.clear'))),
        h('div', { className: 'zct-actions zct-actions-quiet' },
          h('span', { className: 'zct-label' }, t('json.indent')),
          h(Segmented, {
            options: [
              { id: '2', label: t('json.spaces2') },
              { id: '4', label: t('json.spaces4') },
              { id: 'tab', label: t('json.tab') },
            ],
            value: indent,
            onChange: setIndent,
          }),
          h(Switch, { checked: sortKeys, onChange: setSortKeys, label: t('json.sort') })),
        h(ErrorLine, null, error),
        status !== '' ? h('p', { className: 'zct-valid', role: 'status' }, status) : null,
        h(Field, { label: t('json.output') },
          h(TextArea, {
            value: output,
            rows: 8,
            readOnly: true,
            placeholder: t('json.output'),
            spellCheck: false,
          })),
        h('div', { className: 'zct-actions' },
          h(CopyButton, { id: 'json', text: output, copyState, t }),
          output !== '' && !error ? h('span', { className: 'zct-dim' }, output.length + ' ' + t('json.chars')) : null))
    }

    /* ----------------------------------------------------------------- color */

    const NAMED_COLORS = {
      black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000',
      blue: '#0000ff', yellow: '#ffff00', orange: '#ffa500', purple: '#800080',
      gray: '#808080', grey: '#808080', silver: '#c0c0c0', maroon: '#800000',
      olive: '#808000', lime: '#00ff00', teal: '#008080', navy: '#000080',
      aqua: '#00ffff', cyan: '#00ffff', fuchsia: '#ff00ff', magenta: '#ff00ff',
      pink: '#ffc0cb', gold: '#ffd700', brown: '#a52a2a', transparent: '#00000000',
    }

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

    function hex2(value) {
      return Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0')
    }

    function hslToRgb(hue, saturation, lightness) {
      const h = ((hue % 360) + 360) % 360
      const s = clamp(saturation, 0, 1)
      const l = clamp(lightness, 0, 1)
      const c = (1 - Math.abs(2 * l - 1)) * s
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
      const m = l - c / 2
      let r = 0
      let g = 0
      let b = 0
      if (h < 60) { r = c; g = x } else if (h < 120) { r = x; g = c } else if (h < 180) { g = c; b = x } else if (h < 240) { g = x; b = c } else if (h < 300) { r = x; b = c } else { r = c; b = x }
      return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
    }

    function rgbToHsl(r, g, b) {
      const rn = r / 255
      const gn = g / 255
      const bn = b / 255
      const max = Math.max(rn, gn, bn)
      const min = Math.min(rn, gn, bn)
      const l = (max + min) / 2
      let h = 0
      let s = 0
      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
        else if (max === gn) h = (bn - rn) / d + 2
        else h = (rn - gn) / d + 4
        h *= 60
      }
      return { h, s: s * 100, l: l * 100 }
    }

    function parseAlpha(part) {
      if (part === undefined) return 1
      const text = String(part).trim()
      const value = text.endsWith('%') ? Number.parseFloat(text) / 100 : Number.parseFloat(text)
      return Number.isNaN(value) ? 1 : clamp(value, 0, 1)
    }

    function parseColor(raw) {
      const text = String(raw === undefined ? '' : raw).trim().toLowerCase()
      if (text === '') return null
      if (NAMED_COLORS[text] !== undefined) return parseColor(NAMED_COLORS[text])

      const hex = /^#([0-9a-f]{3,8})$/.exec(text)
      if (hex !== null) {
        const digits = hex[1]
        if (digits.length === 3 || digits.length === 4) {
          return {
            r: Number.parseInt(digits[0] + digits[0], 16),
            g: Number.parseInt(digits[1] + digits[1], 16),
            b: Number.parseInt(digits[2] + digits[2], 16),
            a: digits.length === 4 ? Number.parseInt(digits[3] + digits[3], 16) / 255 : 1,
          }
        }
        if (digits.length === 6 || digits.length === 8) {
          return {
            r: Number.parseInt(digits.slice(0, 2), 16),
            g: Number.parseInt(digits.slice(2, 4), 16),
            b: Number.parseInt(digits.slice(4, 6), 16),
            a: digits.length === 8 ? Number.parseInt(digits.slice(6, 8), 16) / 255 : 1,
          }
        }
        return null
      }

      const rgb = /^rgba?\(([^)]+)\)$/.exec(text)
      if (rgb !== null) {
        const parts = rgb[1].split(/[\s,/]+/).filter(part => part !== '')
        if (parts.length < 3 || parts.length > 4) return null
        const channel = (part) => {
          const value = part.endsWith('%') ? Number.parseFloat(part) * 2.55 : Number.parseFloat(part)
          return Number.isNaN(value) ? null : clamp(value, 0, 255)
        }
        const r = channel(parts[0])
        const g = channel(parts[1])
        const b = channel(parts[2])
        if (r === null || g === null || b === null) return null
        return { r, g, b, a: parseAlpha(parts[3]) }
      }

      const hsl = /^hsla?\(([^)]+)\)$/.exec(text)
      if (hsl !== null) {
        const parts = hsl[1].split(/[\s,/]+/).filter(part => part !== '')
        if (parts.length < 3 || parts.length > 4) return null
        const hue = Number.parseFloat(parts[0])
        const saturation = Number.parseFloat(parts[1])
        const lightness = Number.parseFloat(parts[2])
        if ([hue, saturation, lightness].some(value => Number.isNaN(value))) return null
        const rgbValue = hslToRgb(hue, saturation / 100, lightness / 100)
        return { r: rgbValue.r, g: rgbValue.g, b: rgbValue.b, a: parseAlpha(parts[3]) }
      }
      return null
    }

    function colorOutputs(color) {
      const hex = '#' + hex2(color.r) + hex2(color.g) + hex2(color.b)
      const alphaHex = color.a < 1 ? hex + hex2(color.a * 255) : hex
      const rgb = color.a < 1
        ? 'rgba(' + Math.round(color.r) + ', ' + Math.round(color.g) + ', ' + Math.round(color.b) + ', ' + Number(color.a.toFixed(3)) + ')'
        : 'rgb(' + Math.round(color.r) + ', ' + Math.round(color.g) + ', ' + Math.round(color.b) + ')'
      const hslValue = rgbToHsl(color.r, color.g, color.b)
      const hsl = color.a < 1
        ? 'hsla(' + Math.round(hslValue.h) + ', ' + Math.round(hslValue.s) + '%, ' + Math.round(hslValue.l) + '%, ' + Number(color.a.toFixed(3)) + ')'
        : 'hsl(' + Math.round(hslValue.h) + ', ' + Math.round(hslValue.s) + '%, ' + Math.round(hslValue.l) + '%)'
      return { hex: alphaHex, rgb, hsl }
    }

    function ValueRow({ label, value, id, copyState, t }) {
      return h('div', { className: 'zct-color-line' },
        h('span', { className: 'zct-color-key' }, label),
        h('span', { className: 'zct-color-value zct-mono', title: value }, value),
        h(CopyButton, { id, text: value, copyState, t }))
    }

    function ColorTool({ t }) {
      const [input, setInput] = useState('#2F6FD0')
      const copyState = useCopy()
      const color = useMemo(() => parseColor(input), [input])
      const outputs = color === null ? null : colorOutputs(color)
      const pickerValue = color === null
        ? '#000000'
        : '#' + hex2(color.r) + hex2(color.g) + hex2(color.b)

      return h(Fragment, null,
        h(Field, { label: t('color.input') },
          h('div', { className: 'zct-actions' },
            h(Input, {
              value: input,
              spellCheck: false,
              autoComplete: 'off',
              onChange: (event) => { setInput(event.target.value) },
            }),
            h('input', {
              type: 'color',
              className: 'zct-color-input',
              value: pickerValue,
              'aria-label': t('color.pick'),
              onChange: (event) => { setInput(event.target.value) },
            }))),
        color === null ? h(ErrorLine, null, t('color.invalid')) : null,
        color !== null && outputs !== null && h('div', { className: 'zct-card' },
          h('div', { className: 'zct-swatch', role: 'img', 'aria-label': t('color.preview') + ' ' + outputs.hex },
            h('div', {
              className: 'zct-swatch-fill',
              style: { background: 'rgba(' + Math.round(color.r) + ', ' + Math.round(color.g) + ', ' + Math.round(color.b) + ', ' + color.a + ')' },
            })),
          h('div', { className: 'zct-color-list' },
            h(ValueRow, { label: 'HEX', value: outputs.hex, id: 'hex', copyState, t }),
            h(ValueRow, { label: 'RGB', value: outputs.rgb, id: 'rgb', copyState, t }),
            h(ValueRow, { label: 'HSL', value: outputs.hsl, id: 'hsl', copyState, t }))))
    }

    /* ------------------------------------------------------------- timestamp */

    function toLocalInput(ms) {
      const date = new Date(ms)
      const pad = (value) => String(value).padStart(2, '0')
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
        + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds())
    }

    function parseTimestamp(raw) {
      const text = String(raw).trim()
      if (text === '') return null
      if (!/^-?\d+$/.test(text)) return { error: true }
      let ms = Number(text)
      if (Math.abs(ms) < 1e11) ms *= 1000
      const date = new Date(ms)
      if (!Number.isFinite(ms) || Number.isNaN(date.getTime())) return { error: true }
      return { ms, date }
    }

    function relativeLabel(ms, now) {
      const diff = ms - now
      const unit = Math.abs(diff) < 60000
        ? { value: Math.round(diff / 1000), unit: 'second' }
        : Math.abs(diff) < 3600000
          ? { value: Math.round(diff / 60000), unit: 'minute' }
          : Math.abs(diff) < 86400000
            ? { value: Math.round(diff / 3600000), unit: 'hour' }
            : { value: Math.round(diff / 86400000), unit: 'day' }
      try {
        const lang = typeof document !== 'undefined' && document.documentElement.lang !== ''
          ? document.documentElement.lang
          : undefined
        return new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(unit.value, unit.unit)
      } catch (error) {
        return String(unit.value) + ' ' + unit.unit
      }
    }

    function TimestampTool({ t }) {
      const [tick, setTick] = useState(() => Date.now())
      const [secondsInput, setSecondsInput] = useState('')
      const [dateInput, setDateInput] = useState('')
      const copyState = useCopy()

      useEffect(() => {
        const handle = window.setInterval(() => { setTick(Date.now()) }, 1000)
        return () => { window.clearInterval(handle) }
      }, [])

      const parsed = useMemo(() => parseTimestamp(secondsInput), [secondsInput])
      const dateMs = useMemo(() => {
        if (dateInput === '') return null
        const value = new Date(dateInput).getTime()
        return Number.isNaN(value) ? null : value
      }, [dateInput])

      return h(Fragment, null,
        h('div', { className: 'zct-card zct-card-stack' },
          h(ValueRow, { label: t('timestamp.seconds'), value: String(Math.floor(tick / 1000)), id: 'now-s', copyState, t }),
          h(ValueRow, { label: t('timestamp.millis'), value: String(tick), id: 'now-ms', copyState, t }),
          h(ValueRow, { label: t('timestamp.local'), value: new Date(tick).toLocaleString(), id: 'now-local', copyState, t }),
          h(ValueRow, { label: t('timestamp.utc'), value: new Date(tick).toUTCString(), id: 'now-utc', copyState, t }),
          h(ValueRow, { label: t('timestamp.iso'), value: new Date(tick).toISOString(), id: 'now-iso', copyState, t })),

        h(Field, { label: t('timestamp.tsInput') },
          h('div', { className: 'zct-actions' },
            h(Input, {
              value: secondsInput,
              inputMode: 'numeric',
              spellCheck: false,
              placeholder: '1700000000',
              onChange: (event) => { setSecondsInput(event.target.value) },
            }),
            h(Btn, { onClick: () => { setSecondsInput(String(Math.floor(Date.now() / 1000))) } }, t('timestamp.now')))),
        parsed !== null && parsed.error === true ? h(ErrorLine, null, t('timestamp.invalid')) : null,
        parsed !== null && parsed.error === undefined && h('div', { className: 'zct-card zct-card-stack' },
          h(ValueRow, { label: t('timestamp.local'), value: parsed.date.toLocaleString(), id: 'ts-local', copyState, t }),
          h(ValueRow, { label: t('timestamp.utc'), value: parsed.date.toUTCString(), id: 'ts-utc', copyState, t }),
          h(ValueRow, { label: t('timestamp.iso'), value: parsed.date.toISOString(), id: 'ts-iso', copyState, t }),
          h(ValueRow, { label: t('timestamp.relative'), value: relativeLabel(parsed.ms, tick), id: 'ts-rel', copyState, t })),

        h(Field, { label: t('timestamp.dateInput') },
          h(Input, {
            type: 'datetime-local',
            step: 1,
            value: dateInput,
            onChange: (event) => { setDateInput(event.target.value) },
          })),
        dateMs !== null && h('div', { className: 'zct-card zct-card-stack' },
          h(ValueRow, { label: t('timestamp.seconds'), value: String(Math.floor(dateMs / 1000)), id: 'date-s', copyState, t }),
          h(ValueRow, { label: t('timestamp.millis'), value: String(dateMs), id: 'date-ms', copyState, t })),
        h('div', { className: 'zct-actions' },
          h(Btn, { onClick: () => { setDateInput(toLocalInput(Date.now())) } }, t('timestamp.now'))))
    }

    /* ------------------------------------------------------------------ uuid */

    function uuidv4() {
      if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
      const bytes = crypto.getRandomValues(new Uint8Array(16))
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
      return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20)
    }

    function UuidTool({ t }) {
      const [countText, setCountText] = useState('5')
      const [upper, setUpper] = useState(false)
      const [noDash, setNoDash] = useState(false)
      const [nonce, setNonce] = useState(0)
      const copyState = useCopy()
      const count = clamp(Number(countText) || 1, 1, 50)

      const list = useMemo(() => {
        const safeCount = clamp(Number(countText) || 1, 1, 50)
        return Array.from({ length: safeCount }, () => {
          let value = uuidv4()
          if (noDash) value = value.replace(/-/g, '')
          return upper ? value.toUpperCase() : value
        })
      }, [countText, upper, noDash, nonce])

      return h(Fragment, null,
        h('div', { className: 'zct-actions zct-actions-quiet' },
          h('span', { className: 'zct-label' }, t('uuid.count')),
          h('input', {
            type: 'number',
            className: 'zct-input zct-number',
            min: 1,
            max: 50,
            value: countText,
            onChange: (event) => { setCountText(event.target.value) },
            onBlur: () => { setCountText(String(count)) },
          }),
          h(Switch, { checked: upper, onChange: setUpper, label: t('uuid.upper') }),
          h(Switch, { checked: noDash, onChange: setNoDash, label: t('uuid.noDash') }),
          h(Btn, { primary: true, onClick: () => { setNonce(nonce + 1) } }, t('common.generate')),
          h(CopyButton, { id: 'uuid-all', text: list.join('\n'), copyState, t, label: t('uuid.copyAll') })),
        h('div', { className: 'zct-card zct-card-stack' },
          list.map((value, index) => h('div', { className: 'zct-uuid-row', key: index },
            h('span', { className: 'zct-mono zct-uuid-value' }, value),
            h(CopyButton, { id: 'uuid-' + index, text: value, copyState, t })))))
    }

    /* ------------------------------------------------------------------ hash */

    function bytesToBase64(bytes) {
      let binary = ''
      const chunk = 0x8000
      for (let index = 0; index < bytes.length; index += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunk))
      }
      return btoa(binary)
    }

    function HashTool({ t }) {
      const [text, setText] = useState('')
      const [algorithm, setAlgorithm] = useState('SHA-256')
      const [result, setResult] = useState(null)
      const [phase, setPhase] = useState('empty')
      const copyState = useCopy()

      useEffect(() => {
        if (text === '') {
          setResult(null)
          setPhase('empty')
          return undefined
        }
        if (typeof crypto === 'undefined' || crypto.subtle === undefined) {
          setPhase('unsupported')
          return undefined
        }
        let cancelled = false
        setPhase('computing')
        const handle = window.setTimeout(() => {
          crypto.subtle.digest(algorithm, new TextEncoder().encode(text)).then((buffer) => {
            if (cancelled) return
            const bytes = new Uint8Array(buffer)
            const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
            setResult({ hex, base64: bytesToBase64(bytes) })
            setPhase('done')
          }, () => {
            if (!cancelled) setPhase('unsupported')
          })
        }, 180)
        return () => {
          cancelled = true
          window.clearTimeout(handle)
        }
      }, [text, algorithm])

      return h(Fragment, null,
        h(Segmented, {
          options: ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].map(id => ({ id, label: id })),
          value: algorithm,
          onChange: setAlgorithm,
        }),
        h(Field, { label: t('hash.input') },
          h(TextArea, {
            value: text,
            rows: 5,
            spellCheck: false,
            placeholder: t('hash.input'),
            onChange: (event) => { setText(event.target.value) },
          })),
        phase === 'computing' ? h(HintLine, null, t('hash.computing')) : null,
        phase === 'empty' ? h(HintLine, null, t('hash.empty')) : null,
        phase === 'unsupported' ? h(ErrorLine, null, t('hash.unsupported')) : null,
        result !== null && phase === 'done' && h('div', { className: 'zct-card zct-card-stack' },
          h(ValueRow, { label: t('hash.hex'), value: result.hex, id: 'hash-hex', copyState, t }),
          h(ValueRow, { label: t('hash.base64'), value: result.base64, id: 'hash-b64', copyState, t })))
    }

    /* ---------------------------------------------------------------- regex */

    function RegexTool({ t }) {
      const [pattern, setPattern] = useState('')
      const [flags, setFlags] = useState('g')
      const [text, setText] = useState('')
      const [replacement, setReplacement] = useState('')
      const copyState = useCopy()

      const result = useMemo(() => {
        if (pattern === '') return { matches: [], error: '', segments: [] }
        let source
        try {
          source = new RegExp(pattern, flags)
        } catch (error) {
          return { matches: [], error: error.message, segments: [] }
        }
        const matches = []
        try {
          const iterator = new RegExp(source.source, source.flags.includes('g') ? source.flags : source.flags + 'g')
          let match
          while ((match = iterator.exec(text)) !== null) {
            matches.push({
              index: match.index,
              value: match[0],
              captures: match.slice(1),
              groups: match.groups === undefined ? [] : Object.entries(match.groups),
            })
            if (match[0] === '') iterator.lastIndex += 1
            if (matches.length >= 200) break
          }
        } catch (error) {
          return { matches: [], error: error.message, segments: [] }
        }
        const segments = []
        let last = 0
        for (const match of matches) {
          if (match.index < last) continue
          if (match.index > last) segments.push({ text: text.slice(last, match.index), hit: false })
          segments.push({ text: match.value, hit: true })
          last = match.index + match.value.length
        }
        if (last < text.length) segments.push({ text: text.slice(last), hit: false })
        return { matches, error: '', segments }
      }, [pattern, flags, text])

      const replaced = useMemo(() => {
        if (pattern === '' || replacement === '') return ''
        try {
          return text.replace(new RegExp(pattern, flags), replacement)
        } catch (error) {
          return ''
        }
      }, [pattern, flags, text, replacement])

      const toggleFlag = (flag) => {
        setFlags(flags.includes(flag) ? flags.replace(flag, '') : flags + flag)
      }

      return h(Fragment, null,
        h(Field, { label: t('regex.pattern') },
          h('div', { className: 'zct-actions' },
            h(Input, {
              value: pattern,
              placeholder: '\\b\\w+@\\w+\\.\\w+\\b',
              spellCheck: false,
              autoComplete: 'off',
              onChange: (event) => { setPattern(event.target.value) },
            }),
            h('div', { className: 'zct-segmented' },
              ['g', 'i', 'm', 's', 'u'].map(flag => h('button', {
                key: flag,
                type: 'button',
                className: flags.includes(flag) ? 'zct-chip zct-chip-active' : 'zct-chip',
                title: t('regex.flag.' + flag),
                'aria-pressed': flags.includes(flag),
                onClick: () => { toggleFlag(flag) },
              }, flag))))),
        h(ErrorLine, null, result.error),
        h(Field, { label: t('regex.text') },
          h(TextArea, {
            value: text,
            rows: 6,
            spellCheck: false,
            placeholder: t('regex.text'),
            onChange: (event) => { setText(event.target.value) },
          })),
        text !== '' && pattern !== '' && result.error === ''
          ? h(Fragment, null,
            h('p', { className: 'zct-hint-line' }, result.matches.length + ' ' + t('regex.matches')),
            h('pre', { className: 'zct-code zct-highlight' },
              result.segments.map((segment, index) => segment.hit
                ? h('mark', { key: index, className: 'zct-hit' }, segment.text)
                : h('span', { key: index }, segment.text))))
          : null,
        result.matches.length > 0 ? h('div', { className: 'zct-match-list' },
          result.matches.slice(0, 50).map((match, index) => h('div', { className: 'zct-match', key: index },
            h('span', { className: 'zct-match-index' }, '#' + (index + 1) + ' @' + match.index),
            h('code', { className: 'zct-match-value' }, match.value === '' ? '∅' : match.value),
            match.captures.length > 0
              ? h('span', { className: 'zct-match-groups' }, match.captures.map((capture, captureIndex) =>
                h('span', { className: 'zct-chip zct-chip-mini', key: captureIndex }, capture === undefined ? '—' : capture)))
              : null,
            match.groups.length > 0
              ? h('span', { className: 'zct-match-groups' }, match.groups.map(([name, value]) =>
                h('span', { className: 'zct-chip zct-chip-mini', key: name }, name + '=' + value)))
              : null))) : null,
        h(Field, { label: t('regex.replacement') },
          h(Input, {
            value: replacement,
            placeholder: '$& / $1',
            spellCheck: false,
            onChange: (event) => { setReplacement(event.target.value) },
          })),
        replaced !== ''
          ? h(Fragment, null,
            h(Field, { label: t('regex.result') },
              h(TextArea, { value: replaced, rows: 5, readOnly: true })),
            h('div', { className: 'zct-actions' }, h(CopyButton, { id: 'regex-result', text: replaced, copyState, t })))
          : null)
    }

    /* ----------------------------------------------------------------- cron */

    function parseCronField(field, min, max) {
      const values = new Set()
      for (const part of field.split(',')) {
        if (part === '') return null
        const [range, stepText] = part.split('/')
        const step = stepText === undefined ? 1 : Number(stepText)
        if (!Number.isInteger(step) || step <= 0) return null
        if (range === '*') {
          for (let value = min; value <= max; value += step) values.add(value)
          continue
        }
        const bounds = range.split('-')
        const start = Number(bounds[0])
        const end = bounds.length === 1 ? start : Number(bounds[1])
        if (!Number.isInteger(start) || !Number.isInteger(end) || start < min || end > max || start > end) return null
        for (let value = start; value <= end; value += step) values.add(value)
      }
      return values.size === 0 ? null : [...values].sort((a, b) => a - b)
    }

    function parseCron(expression) {
      const parts = expression.trim().split(/\s+/)
      if (parts.length !== 5) return { error: true }
      const minute = parseCronField(parts[0], 0, 59)
      const hour = parseCronField(parts[1], 0, 23)
      const day = parseCronField(parts[2], 1, 31)
      const month = parseCronField(parts[3], 1, 12)
      const weekdayRaw = parseCronField(parts[4], 0, 7)
      if (minute === null || hour === null || day === null || month === null || weekdayRaw === null) return { error: true }
      return {
        minute,
        hour,
        day,
        month,
        weekday: [...new Set(weekdayRaw.map(value => value === 7 ? 0 : value))].sort((a, b) => a - b),
        dayRestricted: !parts[2].startsWith('*'),
        weekdayRestricted: !parts[4].startsWith('*'),
      }
    }

    function nextCronRuns(parsed, count) {
      const runs = []
      const start = new Date()
      start.setSeconds(0, 0)
      let time = start.getTime() + 60000
      for (let step = 0; step < 527040 && runs.length < count; step += 1, time += 60000) {
        const date = new Date(time)
        if (!parsed.minute.includes(date.getMinutes())) continue
        if (!parsed.hour.includes(date.getHours())) continue
        if (!parsed.month.includes(date.getMonth() + 1)) continue
        const dayMatch = parsed.day.includes(date.getDate())
        const weekdayMatch = parsed.weekday.includes(date.getDay())
        // Vixie cron ORs day-of-month and day-of-week when both fields are restricted.
        const dateMatch = parsed.dayRestricted && parsed.weekdayRestricted
          ? dayMatch || weekdayMatch
          : dayMatch && weekdayMatch
        if (!dateMatch) continue
        runs.push(date)
      }
      return runs
    }

    function CronTool({ t }) {
      const [expression, setExpression] = useState('*/5 * * * *')
      const [runs, setRuns] = useState([])
      const parsed = useMemo(() => parseCron(expression), [expression])
      const copyState = useCopy()
      const field = (values, full) => values.length === full
        ? '*'
        : values.length > 12 ? values.slice(0, 12).join(', ') + ' …' : values.join(', ')

      return h(Fragment, null,
        h(Field, { label: t('cron.expression') },
          h('div', { className: 'zct-actions' },
            h(Input, {
              value: expression,
              spellCheck: false,
              autoComplete: 'off',
              placeholder: '*/5 * * * *',
              onChange: (event) => { setExpression(event.target.value); setRuns([]) },
            }),
            h(Btn, {
              primary: true,
              disabled: parsed.error === true,
              onClick: () => { setRuns(nextCronRuns(parsed, 5)) },
            }, t('cron.next')),
            h(CopyButton, { id: 'cron-expression', text: expression, copyState, t }))),
        parsed.error === true ? h(ErrorLine, null, t('cron.invalid')) : null,
        parsed.error === undefined && h('div', { className: 'zct-card zct-card-stack' },
          h(ValueRow, { label: t('cron.minute'), value: field(parsed.minute, 60), id: 'cron-minute', copyState, t }),
          h(ValueRow, { label: t('cron.hour'), value: field(parsed.hour, 24), id: 'cron-hour', copyState, t }),
          h(ValueRow, { label: t('cron.day'), value: field(parsed.day, 31), id: 'cron-day', copyState, t }),
          h(ValueRow, { label: t('cron.month'), value: field(parsed.month, 12), id: 'cron-month', copyState, t }),
          h(ValueRow, { label: t('cron.weekday'), value: field(parsed.weekday, 7), id: 'cron-weekday', copyState, t })),
        runs.length > 0 ? h('div', { className: 'zct-card zct-card-stack' },
          runs.map((run, index) => h(ValueRow, {
            key: index,
            label: '#' + (index + 1),
            value: run.toLocaleString(),
            id: 'cron-run-' + index,
            copyState,
            t,
          }))) : null,
        parsed.error === undefined && runs.length === 0
          ? h(HintLine, null, t('cron.empty'))
          : null,
        parsed.error === undefined ? h(HintLine, null, t('cron.localHint')) : null)
    }

    /* ------------------------------------------------------------------ url */

    function UrlTool({ t }) {
      const [input, setInput] = useState('')
      const copyState = useCopy()
      const parsed = useMemo(() => {
        const trimmed = input.trim()
        if (trimmed === '') return null
        try {
          const url = new URL(trimmed)
          return { url, params: [...url.searchParams.entries()] }
        } catch (error) {
          return { error: true }
        }
      }, [input])

      const rows = parsed !== null && parsed.error === undefined ? [
        [t('url.origin'), parsed.url.origin],
        [t('url.protocol'), parsed.url.protocol],
        [t('url.host'), parsed.url.host],
        [t('url.port'), parsed.url.port === '' ? '—' : parsed.url.port],
        [t('url.path'), parsed.url.pathname],
        [t('url.search'), parsed.url.search === '' ? '—' : parsed.url.search],
        [t('url.hash'), parsed.url.hash === '' ? '—' : parsed.url.hash],
      ] : []

      const json = parsed !== null && parsed.error === undefined
        ? JSON.stringify({ url: parsed.url.href, params: parsed.params }, null, 2)
        : ''

      return h(Fragment, null,
        h(Field, { label: t('url.input') },
          h(Input, {
            value: input,
            spellCheck: false,
            autoComplete: 'off',
            placeholder: 'https://example.com/path?x=1&y=2',
            onChange: (event) => { setInput(event.target.value) },
          })),
        parsed !== null && parsed.error === true ? h(ErrorLine, null, t('url.invalid')) : null,
        parsed !== null && parsed.error === undefined
          ? h(Fragment, null,
            h('div', { className: 'zct-card zct-card-stack' },
              rows.map(([label, value]) => h(ValueRow, { key: label, label, value: String(value), id: 'url-' + label, copyState, t }))),
            parsed.params.length > 0
              ? h('div', { className: 'zct-table-wrap' },
                h('table', { className: 'zct-table' },
                  h('thead', null, h('tr', null, h('th', null, t('url.key')), h('th', null, t('url.value')))),
                  h('tbody', null, parsed.params.map(([key, value], index) => h('tr', { key: index },
                    h('td', null, key),
                    h('td', { className: 'zct-dim' }, value))))))
              : h(HintLine, null, t('url.noParams')),
            h('div', { className: 'zct-actions' }, h(CopyButton, { id: 'url-json', text: json, copyState, t, label: t('url.copyJson') })))
          : null)
    }

    /* ----------------------------------------------------------------- text */

    function splitWords(text) {
      return text
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .split(/[^A-Za-z0-9\u4e00-\u9fff]+/)
        .filter(word => word !== '')
    }

    const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()

    const CASE_TRANSFORMS = {
      upper: (text) => text.toUpperCase(),
      lower: (text) => text.toLowerCase(),
      title: (text) => text.replace(/\S+/g, capitalize),
      camel: (text) => splitWords(text).map((word, index) => index === 0 ? word.toLowerCase() : capitalize(word)).join(''),
      pascal: (text) => splitWords(text).map(capitalize).join(''),
      snake: (text) => splitWords(text).map(word => word.toLowerCase()).join('_'),
      kebab: (text) => splitWords(text).map(word => word.toLowerCase()).join('-'),
      constant: (text) => splitWords(text).map(word => word.toUpperCase()).join('_'),
    }

    function TextTool({ t }) {
      const [input, setInput] = useState('')
      const copyState = useCopy()
      const stats = useMemo(() => ({
        chars: Array.from(input).length,
        bytes: new TextEncoder().encode(input).length,
        words: input.trim() === '' ? 0 : input.trim().split(/\s+/).length,
        lines: input === '' ? 0 : input.split('\n').length,
        cjk: (input.match(/[\u3400-\u9fff]/g) || []).length,
      }), [input])

      return h(Fragment, null,
        h(Field, { label: t('text.input') },
          h(TextArea, {
            value: input,
            rows: 8,
            spellCheck: false,
            placeholder: t('text.input'),
            onChange: (event) => { setInput(event.target.value) },
          })),
        h('div', { className: 'zct-stats' },
          [['chars', stats.chars], ['bytes', stats.bytes], ['words', stats.words], ['lines', stats.lines], ['cjk', stats.cjk]]
            .map(([key, value]) => h('span', { className: 'zct-stat', key }, h('strong', null, String(value)), ' ' + t('text.' + key)))),
        h('div', { className: 'zct-actions' },
          Object.keys(CASE_TRANSFORMS).map(key => h(Btn, {
            key,
            onClick: () => { setInput(CASE_TRANSFORMS[key](input)) },
          }, t('text.' + key))),
          h(Btn, { onClick: () => { setInput(input.replace(/[ \t]+/g, ' ').trim()) } }, t('text.trim'))),
        h('div', { className: 'zct-actions' },
          h(CopyButton, { id: 'text-copy', text: input, copyState, t })))
    }

    /* ------------------------------------------------------------------ jwt */

    function base64UrlDecode(text) {
      const normalized = text.replace(/-/g, '+').replace(/_/g, '/')
      const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4)
      const binary = atob(padded)
      const bytes = new Uint8Array(binary.length)
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    }

    function JwtTool({ t }) {
      const [input, setInput] = useState('')
      const copyState = useCopy()
      const parsed = useMemo(() => {
        const token = input.trim()
        if (token === '') return null
        const parts = token.split('.')
        if (parts.length < 2) return { error: true }
        try {
          return {
            header: JSON.stringify(JSON.parse(base64UrlDecode(parts[0])), null, 2),
            payload: JSON.stringify(JSON.parse(base64UrlDecode(parts[1])), null, 2),
            claims: JSON.parse(base64UrlDecode(parts[1])),
            signed: parts.length >= 3 && parts[2] !== '',
          }
        } catch (error) {
          return { error: true }
        }
      }, [input])

      const claims = parsed !== null && parsed.error === undefined
        && parsed.claims !== null && typeof parsed.claims === 'object' ? parsed.claims : {}
      const exp = typeof claims.exp === 'number' ? claims.exp : null
      const expired = exp !== null && exp * 1000 <= Date.now()
      const timeRow = (key, label) => {
        const value = claims[key]
        if (typeof value !== 'number') return null
        return h(ValueRow, {
          key,
          label,
          value: new Date(value * 1000).toLocaleString(),
          id: 'jwt-' + key,
          copyState,
          t,
        })
      }

      return h(Fragment, null,
        h(Field, { label: t('jwt.input') },
          h(TextArea, {
            value: input,
            rows: 5,
            spellCheck: false,
            placeholder: 'eyJhbGciOi...',
            onChange: (event) => { setInput(event.target.value) },
          })),
        parsed !== null && parsed.error === true ? h(ErrorLine, null, t('jwt.invalid')) : null,
        parsed !== null && parsed.error === undefined
          ? h(Fragment, null,
            h(Field, { label: t('jwt.header') },
              h(TextArea, { value: parsed.header, rows: 5, readOnly: true })),
            h(Field, { label: t('jwt.payload') },
              h(TextArea, { value: parsed.payload, rows: 8, readOnly: true })),
            h('div', { className: 'zct-card zct-card-stack' },
              timeRow('exp', t('jwt.exp')),
              timeRow('iat', t('jwt.iat')),
              timeRow('nbf', t('jwt.nbf'))),
            exp !== null
              ? h('p', { className: expired ? 'zct-error' : 'zct-valid' },
                (expired ? t('jwt.expired') : t('jwt.active')) + ' · ' + relativeLabel(exp * 1000, Date.now()))
              : null,
            h(HintLine, null, t('jwt.note') + (parsed.signed ? '' : ' · ' + t('jwt.unsigned'))),
            h('div', { className: 'zct-actions' },
              h(CopyButton, { id: 'jwt-header', text: parsed.header, copyState, t }),
              h(CopyButton, { id: 'jwt-payload', text: parsed.payload, copyState, t })))
          : null)
    }

    /* ----------------------------------------------------------------- diff */

    function diffLines(left, right, options) {
      const a = left.replace(/\r\n?/g, '\n').split('\n')
      const b = right.replace(/\r\n?/g, '\n').split('\n')
      const normalize = (line) => {
        let value = line
        if (options.ignoreWhitespace) value = value.trim().replace(/\s+/g, ' ')
        if (options.ignoreCase) value = value.toLowerCase()
        return value
      }
      const na = a.map(normalize)
      const nb = b.map(normalize)
      if (a.length * b.length > 1000000) return null
      const table = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1))
      for (let i = a.length - 1; i >= 0; i -= 1) {
        for (let j = b.length - 1; j >= 0; j -= 1) {
          table[i][j] = na[i] === nb[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
        }
      }
      const ops = []
      let i = 0
      let j = 0
      while (i < a.length && j < b.length) {
        if (na[i] === nb[j]) { ops.push({ type: 'same', text: a[i] }); i += 1; j += 1 }
        else if (table[i + 1][j] >= table[i][j + 1]) { ops.push({ type: 'del', text: a[i] }); i += 1 }
        else { ops.push({ type: 'add', text: b[j] }); j += 1 }
      }
      while (i < a.length) { ops.push({ type: 'del', text: a[i] }); i += 1 }
      while (j < b.length) { ops.push({ type: 'add', text: b[j] }); j += 1 }
      return ops
    }

    function DiffTool({ t }) {
      const [left, setLeft] = useState('')
      const [right, setRight] = useState('')
      const [ignoreCase, setIgnoreCase] = useState(false)
      const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)
      const copyState = useCopy()
      const ops = useMemo(
        () => (left === '' && right === '') ? [] : diffLines(left, right, { ignoreCase, ignoreWhitespace }),
        [left, right, ignoreCase, ignoreWhitespace],
      )
      const added = ops === null ? 0 : ops.filter(op => op.type === 'add').length
      const removed = ops === null ? 0 : ops.filter(op => op.type === 'del').length
      const text = ops === null ? '' : ops.map(op => (op.type === 'add' ? '+ ' : op.type === 'del' ? '- ' : '  ') + op.text).join('\n')

      return h(Fragment, null,
        h('div', { className: 'zct-grid2' },
          h(Field, { label: t('diff.left') },
            h(TextArea, {
              value: left,
              rows: 7,
              spellCheck: false,
              placeholder: t('diff.left'),
              onChange: (event) => { setLeft(event.target.value) },
            })),
          h(Field, { label: t('diff.right') },
            h(TextArea, {
              value: right,
              rows: 7,
              spellCheck: false,
              placeholder: t('diff.right'),
              onChange: (event) => { setRight(event.target.value) },
            }))),
        h('div', { className: 'zct-actions zct-actions-quiet' },
          h(Switch, {
            checked: ignoreWhitespace,
            onChange: setIgnoreWhitespace,
            label: t('diff.ignoreWhitespace'),
          }),
          h(Switch, {
            checked: ignoreCase,
            onChange: setIgnoreCase,
            label: t('diff.ignoreCase'),
          })),
        ops === null ? h(ErrorLine, null, t('diff.tooLarge')) : null,
        ops !== null && (left !== '' || right !== '') && added === 0 && removed === 0
          ? h(HintLine, null, t('diff.identical'))
          : null,
        ops !== null && ops.length > 0
          ? h(Fragment, null,
            h('p', { className: 'zct-hint-line' }, '+' + added + ' · -' + removed),
            h('div', { className: 'zct-code zct-diff' }, ops.map((op, index) =>
              h('div', {
                key: index,
                className: op.type === 'add' ? 'zct-diff-add' : op.type === 'del' ? 'zct-diff-del' : 'zct-diff-same',
              }, (op.type === 'add' ? '+ ' : op.type === 'del' ? '- ' : '  ') + op.text))),
            h('div', { className: 'zct-actions' }, h(CopyButton, { id: 'diff-copy', text, copyState, t })))
          : null)
    }


    const TOOLS = [
      { id: 'json', title: 'tool.json.title', desc: 'tool.json.desc', icon: JsonIcon, Component: JsonTool },
      { id: 'encode', title: 'tool.encode.title', desc: 'tool.encode.desc', icon: EncodeIcon, Component: EncodingTool },
      { id: 'password', title: 'tool.password.title', desc: 'tool.password.desc', icon: PasswordIcon, Component: PasswordTool },
      { id: 'regex', title: 'tool.regex.title', desc: 'tool.regex.desc', icon: RegexIcon, Component: RegexTool },
      { id: 'timestamp', title: 'tool.timestamp.title', desc: 'tool.timestamp.desc', icon: ClockIcon, Component: TimestampTool },
      { id: 'color', title: 'tool.color.title', desc: 'tool.color.desc', icon: ColorIcon, Component: ColorTool },
      { id: 'ascii', title: 'tool.ascii.title', desc: 'tool.ascii.desc', icon: AsciiIcon, Component: AsciiTool },
      { id: 'hash', title: 'tool.hash.title', desc: 'tool.hash.desc', icon: HashIcon, Component: HashTool },
      { id: 'uuid', title: 'tool.uuid.title', desc: 'tool.uuid.desc', icon: UuidIcon, Component: UuidTool },
      { id: 'diff', title: 'tool.diff.title', desc: 'tool.diff.desc', icon: DiffIcon, Component: DiffTool },
      { id: 'url', title: 'tool.url.title', desc: 'tool.url.desc', icon: UrlIcon, Component: UrlTool },
      { id: 'text', title: 'tool.text.title', desc: 'tool.text.desc', icon: TextIcon, Component: TextTool },
      { id: 'jwt', title: 'tool.jwt.title', desc: 'tool.jwt.desc', icon: JwtIcon, Component: JwtTool },
      { id: 'cron', title: 'tool.cron.title', desc: 'tool.cron.desc', icon: CronIcon, Component: CronTool },
    ]

    const TOOL_IDS = TOOLS.map(tool => tool.id)
    const DEFAULT_PREFS = { sort: 'usage', visibleCount: 6, order: TOOL_IDS, usage: {} }

    function normalizePrefs(raw) {
      const source = raw !== null && typeof raw === 'object' ? raw : {}
      const order = Array.isArray(source.order) ? source.order.filter(id => TOOL_IDS.includes(id)) : []
      for (const id of TOOL_IDS) if (!order.includes(id)) order.push(id)
      const usage = {}
      if (source.usage !== null && typeof source.usage === 'object') {
        for (const id of TOOL_IDS) {
          const count = Number(source.usage[id])
          if (Number.isFinite(count) && count > 0) usage[id] = Math.floor(count)
        }
      }
      return {
        sort: source.sort === 'manual' ? 'manual' : 'usage',
        visibleCount: clamp(Number(source.visibleCount) || 6, 3, TOOLS.length),
        order,
        usage,
      }
    }

    function loadPrefs() {
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(PREFS_KEY)
          if (raw !== null) return normalizePrefs(JSON.parse(raw))
        }
      } catch (error) {
        /* malformed or blocked storage falls back to defaults */
      }
      return normalizePrefs(null)
    }

    function savePrefs(prefs) {
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
      } catch (error) {
        /* preferences stay in memory when storage is unavailable */
      }
    }

    function setPrefs(next) {
      state.prefs = normalizePrefs(next)
      savePrefs(state.prefs)
      emit()
    }

    function recordUsage(id) {
      if (!TOOL_IDS.includes(id)) return
      const usage = { ...(state.prefs === undefined ? {} : state.prefs.usage) }
      usage[id] = (usage[id] || 0) + 1
      setPrefs({ ...state.prefs, usage })
    }

    function menuTools(prefs) {
      const order = prefs.order
      const sorted = prefs.sort === 'usage'
        ? [...order].sort((a, b) => (prefs.usage[b] || 0) - (prefs.usage[a] || 0) || order.indexOf(a) - order.indexOf(b))
        : order
      return sorted.slice(0, prefs.visibleCount)
        .map(id => TOOLS.find(tool => tool.id === id))
        .filter(tool => tool !== undefined)
    }

    state.prefs = loadPrefs()

    const identity = (key) => key

    function SettingsPane({ t }) {
      const prefs = useStore((snapshot) => snapshot.prefs)
      const move = (index, delta) => {
        const target = index + delta
        if (target < 0 || target >= prefs.order.length) return
        const order = [...prefs.order]
        const swap = order[index]
        order[index] = order[target]
        order[target] = swap
        setPrefs({ ...prefs, order })
      }
      return h('div', { className: 'zct-settings' },
        h('div', { className: 'zct-field' },
          h('span', { className: 'zct-label' }, t('settings.sort')),
          h(Segmented, {
            options: [
              { id: 'usage', label: t('settings.sortUsage') },
              { id: 'manual', label: t('settings.sortManual') },
            ],
            value: prefs.sort,
            onChange: (sort) => { setPrefs({ ...prefs, sort }) },
          })),
        h(Field, { label: t('settings.visible') + ': ' + prefs.visibleCount },
          h('input', {
            type: 'range',
            className: 'zct-range',
            min: 3,
            max: TOOLS.length,
            step: 1,
            value: prefs.visibleCount,
            onChange: (event) => { setPrefs({ ...prefs, visibleCount: Number(event.target.value) }) },
          })),
        h('p', { className: 'zct-hint-line' }, t('settings.hint')),
        h('div', { className: 'zct-field' },
          h('span', { className: 'zct-label' }, t('settings.order')),
          h('div', { className: 'zct-order' },
            prefs.order.map((id, index) => {
              const tool = TOOLS.find(entry => entry.id === id)
              if (tool === undefined) return null
              const count = prefs.usage[id] || 0
              return h('div', { className: 'zct-order-row', key: id },
                h('span', { className: 'zct-tool-icon' }, h(tool.icon)),
                h('span', { className: 'zct-order-name' }, t(tool.title)),
                count > 0 ? h('span', { className: 'zct-order-count' }, count + ' ' + t('settings.uses')) : null,
                h('button', {
                  type: 'button',
                  className: 'zct-icon-btn',
                  'aria-label': t('settings.moveUp'),
                  disabled: index === 0,
                  onClick: () => { move(index, -1) },
                }, '↑'),
                h('button', {
                  type: 'button',
                  className: 'zct-icon-btn',
                  'aria-label': t('settings.moveDown'),
                  disabled: index === prefs.order.length - 1,
                  onClick: () => { move(index, 1) },
                }, '↓'))
            }))),
        h('div', { className: 'zct-actions' },
          h(Btn, {
            onClick: () => { setPrefs({ sort: DEFAULT_PREFS.sort, visibleCount: DEFAULT_PREFS.visibleCount, order: [...TOOL_IDS], usage: {} }) },
          }, t('settings.reset'))))
    }

    function AboutPane({ t }) {
      const copyState = useCopy()
      const openSite = (event, url) => {
        event.preventDefault()
        openExternal(url)
      }
      return h('div', { className: 'zct-about' },
        h('div', { className: 'zct-about-head' },
          h('span', { className: 'zct-brand-mark zct-brand-lg' }, h(ToolboxIcon, { size: 22 })),
          h('div', null,
            h('div', { className: 'zct-about-title' }, t('panel.title')),
            h('div', { className: 'zct-about-sub' }, t('about.version') + ' ' + VERSION + ' · ' + t('panel.local')))),
        h('div', { className: 'zct-about-grid' },
          h('div', { className: 'zct-about-card' },
            h('span', { className: 'zct-label' }, t('about.website')),
            h('a', {
              className: 'zct-link zct-about-link',
              href: BRAND_HOME,
              target: '_blank',
              rel: 'noreferrer noopener',
              onClick: (event) => { openSite(event, BRAND_HOME) },
            }, BRAND_SITE_LABEL),
            h('div', { className: 'zct-actions' },
              h(CopyButton, { id: 'about-site', text: BRAND_HOME, copyState, t, label: t('about.copyLink') }),
              h('a', {
                className: 'zct-btn',
                href: BRAND_SOFTWARE,
                target: '_blank',
                rel: 'noreferrer noopener',
                onClick: (event) => { openSite(event, BRAND_SOFTWARE) },
              }, t('about.software'))),
            h('p', { className: 'zct-hint-line' }, t('about.note')),

            h('div', { className: 'zct-about-sep' }),
            h('span', { className: 'zct-label' }, t('about.github')),
            h('a', {
              className: 'zct-link zct-about-repo',
              href: BRAND_GITHUB,
              target: '_blank',
              rel: 'noreferrer noopener',
              onClick: (event) => { openSite(event, BRAND_GITHUB) },
            }, 'ax2/dsh-zicode-tools'),
            h('div', { className: 'zct-actions' },
              h('a', {
                className: 'zct-btn zct-btn-primary',
                href: BRAND_GITHUB,
                target: '_blank',
                rel: 'noreferrer noopener',
                onClick: (event) => { openSite(event, BRAND_GITHUB) },
              }, h(StarIcon), t('about.star')),
              h(CopyButton, { id: 'about-github', text: BRAND_GITHUB, copyState, t, label: t('about.copyLink') })),
            h('p', { className: 'zct-hint-line' }, t('about.starNote'))),
          h('figure', { className: 'zct-about-qr' },
            h('img', {
              src: WECHAT_QR,
              width: 180,
              height: 180,
              alt: t('about.wechat'),
            }),
            h('figcaption', null, t('about.scan')))))
    }

    const MENU_CSS = `.zct-menu{position:fixed;z-index:70;width:248px;max-width:calc(100vw - 16px);max-height:min(60vh,420px);overflow:auto;padding:6px;border:0.5px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-overlay));backdrop-filter:var(--dsw-menu-backdrop-filter,blur(12px));box-shadow:var(--dsw-elevation-prominent,0 18px 48px rgba(0,0,0,.28));color:var(--dsw-alias-label-primary);font-size:13px;pointer-events:auto}
.zct-menu-head{display:flex;align-items:center;gap:6px;padding:6px 8px 4px;font-size:12px;color:var(--dsw-alias-label-secondary);letter-spacing:.01em}
.zct-menu-brandmark{display:flex;flex:none;color:var(--dsw-alias-brand-primary)}
.zct-menu-item{display:flex;align-items:center;gap:9px;width:100%;height:32px;padding:0 8px;border:none;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;text-align:left;cursor:pointer}
.zct-menu-item:hover,.zct-menu-item:focus-visible{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));color:var(--dsw-alias-label-primary);outline:none}
.zct-menu-icon{display:flex;flex:none;color:var(--dsw-alias-label-tertiary)}
.zct-menu-item:hover .zct-menu-icon,.zct-menu-item:focus-visible .zct-menu-icon{color:var(--dsw-alias-brand-primary)}
.zct-menu-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.zct-menu-count{flex:none;font-size:11px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.zct-menu-sep{height:1px;margin:5px 6px;background:var(--dsw-alias-border-l1)}
`

    const CSS = `
.zct-backdrop{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(9,12,18,.38);pointer-events:auto}
.zct-dialog{display:flex;flex-direction:column;width:min(940px,100%);height:min(640px,100%);min-height:320px;overflow:hidden;border:0.5px solid var(--dsw-alias-border-l1);border-radius:16px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);box-shadow:var(--dsw-elevation-prominent,0 24px 64px rgba(0,0,0,.3));font-family:inherit;font-size:13px;line-height:1.5}
.zct-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 18px;border-bottom:0.5px solid var(--dsw-alias-border-l1)}
.zct-brand{display:flex;align-items:center;gap:10px;min-width:0}
.zct-brand-mark{flex:none;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-label-primary-inverted,#fff))}
.zct-brand-title{font-size:14px;font-weight:600;line-height:20px}
.zct-brand-sub{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}
.zct-head-right{display:flex;align-items:center;gap:10px;flex:none}
.zct-kbd{font-family:var(--dsh-font-family-code,ui-monospace,monospace);font-size:11px;padding:2px 6px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:5px;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-1)}
.zct-close{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.zct-close:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.zct-body{flex:1;min-height:0;display:flex}
.zct-rail{flex:none;width:212px;display:flex;flex-direction:column;gap:8px;padding:12px;border-right:0.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);overflow:auto}
.zct-rail-search{height:30px}
.zct-rail-label{font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary);padding:4px 4px 0}
.zct-rail-sep{height:1px;margin:6px 4px;background:var(--dsw-alias-border-l1)}
.zct-tool-list{display:flex;flex-direction:column;gap:2px}
.zct-tool-item{display:flex;align-items:center;gap:9px;width:100%;height:34px;padding:0 9px;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;text-align:left;cursor:pointer}
.zct-tool-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.zct-tool-item-active{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));color:var(--dsw-alias-label-primary);font-weight:600}
.zct-tool-icon{display:flex;flex:none;color:var(--dsw-alias-label-tertiary)}
.zct-tool-item-active .zct-tool-icon{color:var(--dsw-alias-brand-primary)}
.zct-tool-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.zct-main{flex:1;min-width:0;display:flex;flex-direction:column}
.zct-main-head{flex:none;padding:16px 22px 10px}
.zct-main-title{margin:0;font-size:15px;font-weight:600;line-height:22px}
.zct-main-desc{margin:3px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.zct-pane{flex:1;min-height:0;overflow:auto;padding:6px 22px 22px;display:flex;flex-direction:column;gap:12px;overscroll-behavior:contain}
.zct-tool-panel{display:flex;flex-direction:column;gap:12px}
.zct-tool-panel[hidden]{display:none}
.zct-valid{margin:0;color:var(--dsw-alias-state-success-primary);font-size:12px}
.zct-foot{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:7px 18px;border-top:0.5px solid var(--dsw-alias-border-l1);font-size:11px;color:var(--dsw-alias-label-tertiary)}
.zct-shortcuts{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap}
.zct-sep-dot{opacity:.6}
.zct-foot-brand{display:flex;align-items:center;gap:8px;flex:none}
.zct-foot-qr{display:flex;align-items:center;justify-content:center;width:38px;height:38px;padding:1px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:7px;background:#fff;cursor:pointer;overflow:hidden}
.zct-foot-qr img{display:block;width:34px;height:34px;border-radius:5px}
.zct-foot-brandtext{display:flex;flex-direction:column;gap:1px;line-height:14px}
.zct-foot-brandtext .zct-link{font-size:11px}
.zct-foot-wechat{padding:0;border:none;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:11px;text-align:left;cursor:pointer}
.zct-foot-wechat:hover{color:var(--dsw-alias-label-secondary)}
.zct-link{color:var(--dsw-alias-link);text-decoration:none}
.zct-link:hover{text-decoration:underline}
.zct-field{display:flex;flex-direction:column;gap:6px}
.zct-label{font-size:12px;color:var(--dsw-alias-label-secondary)}
.zct-hint{font-size:11px;color:var(--dsw-alias-label-tertiary)}
.zct-input,.zct-textarea{width:100%;box-sizing:border-box;border:0.5px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;padding:7px 10px;outline:none}
.zct-input:focus,.zct-textarea:focus{border-color:var(--dsw-alias-brand-primary)}
.zct-textarea{resize:vertical;min-height:96px;line-height:1.55}
.zct-mono{font-family:var(--dsh-font-family-code,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);font-size:12px}
.zct-textarea[readonly]{color:var(--dsw-alias-label-secondary)}
.zct-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.zct-actions-quiet{gap:10px}
.zct-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:28px;padding:0 12px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;text-decoration:none;cursor:pointer}
.zct-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));color:var(--dsw-alias-label-primary)}
.zct-btn:disabled{opacity:.45;cursor:default}
.zct-btn-primary{border-color:transparent;background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-label-primary-inverted,#fff))}
.zct-btn-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-button-primary-fill));color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-label-primary-inverted,#fff))}
.zct-chip{height:26px;padding:0 10px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}
.zct-chip:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.zct-chip-active{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.zct-segmented{display:flex;flex-wrap:wrap;gap:6px}
.zct-switch-row{display:flex;align-items:center;gap:8px;border:none;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;padding:4px 0;cursor:pointer;text-align:left}
.zct-switch{position:relative;flex:none;width:28px;height:16px;border-radius:999px;background:var(--dsw-alias-border-l2);transition:background .15s}
.zct-switch-on{background:var(--dsw-alias-state-business-primary)}
.zct-knob{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.28);transition:transform .15s}
.zct-switch-on .zct-knob{transform:translateX(12px)}
.zct-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 16px}
.zct-stats{display:flex;flex-wrap:wrap;gap:8px 16px;padding:10px 12px;border:0.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);font-size:12px;color:var(--dsw-alias-label-tertiary)}
.zct-stat strong{color:var(--dsw-alias-label-primary);font-weight:600;font-variant-numeric:tabular-nums}
.zct-settings{display:flex;flex-direction:column;gap:16px}
.zct-about{display:flex;flex-direction:column;gap:18px;max-width:780px}
.zct-about-head{display:flex;align-items:center;gap:12px}
.zct-brand-lg{width:44px;height:44px;border-radius:12px}
.zct-about-title{font-size:16px;font-weight:600;line-height:22px}
.zct-about-sub{font-size:12px;color:var(--dsw-alias-label-tertiary)}
.zct-about-grid{display:flex;align-items:flex-start;gap:28px;flex-wrap:wrap}
.zct-about-card{flex:1;min-width:220px;display:flex;flex-direction:column;gap:8px;padding:14px;border:0.5px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}
.zct-about-link{font-size:16px;font-weight:600}
.zct-about-repo{font-size:13px;overflow-wrap:anywhere}
.zct-about-sep{height:1px;margin:4px 0;background:var(--dsw-alias-border-l1)}
.zct-about-qr{margin:0;display:flex;flex-direction:column;align-items:center;gap:8px}
.zct-about-qr img{display:block;width:180px;height:180px;border-radius:12px;border:0.5px solid var(--dsw-alias-border-l2);background:#fff}
.zct-about-qr figcaption{font-size:12px;color:var(--dsw-alias-label-tertiary)}
.zct-order{display:flex;flex-direction:column;gap:2px;border:0.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:6px}
.zct-order-row{display:flex;align-items:center;gap:9px;min-height:32px;padding:0 6px;border-radius:7px;font-size:12px}
.zct-order-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.zct-order-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary)}
.zct-order-count{flex:none;font-size:11px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.zct-icon-btn{display:inline-flex;align-items:center;justify-content:center;flex:none;width:24px;height:24px;padding:0;border:0.5px solid var(--dsw-alias-border-l2);border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}
.zct-icon-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.zct-icon-btn:disabled{opacity:.35;cursor:default}
.zct-card{display:flex;align-items:flex-start;gap:16px;padding:12px 14px;border:0.5px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}
.zct-card-stack{flex-direction:column;align-items:stretch;gap:8px}
.zct-glyph{flex:none;display:flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:12px;background:var(--dsw-alias-bg-overlay);border:0.5px solid var(--dsw-alias-border-l2);font-family:var(--dsh-font-family-code,ui-monospace,monospace);font-size:28px;color:var(--dsw-alias-label-primary)}
.zct-values{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 18px;margin:0;flex:1;min-width:0}
.zct-values dt{font-size:10px;color:var(--dsw-alias-label-tertiary);text-transform:uppercase;letter-spacing:.05em}
.zct-values dd{margin:2px 0 0;font-family:var(--dsh-font-family-code,ui-monospace,monospace);font-size:12px;overflow:hidden;text-overflow:ellipsis}
.zct-card-actions{margin-left:auto;flex:none}
.zct-chips{display:flex;flex-wrap:wrap;gap:6px}
.zct-chip-glyph{font-family:var(--dsh-font-family-code,ui-monospace,monospace);font-size:13px;margin-right:6px}
.zct-chip-code{font-family:var(--dsh-font-family-code,ui-monospace,monospace);font-size:11px;color:var(--dsw-alias-label-tertiary)}
.zct-table-wrap{border:0.5px solid var(--dsw-alias-border-l1);border-radius:10px;overflow:auto;max-height:44vh}
.zct-table{width:100%;border-collapse:collapse;font-family:var(--dsh-font-family-code,ui-monospace,monospace);font-size:12px;font-variant-numeric:tabular-nums}
.zct-table th{position:sticky;top:0;z-index:1;text-align:left;padding:6px 10px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-tertiary);font-weight:500;font-size:11px;border-bottom:0.5px solid var(--dsw-alias-border-l1);white-space:nowrap}
.zct-table td{padding:3px 10px;border-bottom:0.5px solid var(--dsw-alias-border-l1);white-space:nowrap}
.zct-table tr:last-child td{border-bottom:none}
.zct-row{cursor:pointer;outline:none}
.zct-row:hover td,.zct-row:focus td{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.zct-char{font-size:14px;text-align:center}
.zct-dim{color:var(--dsw-alias-label-tertiary)}
.zct-password-card{display:flex;flex-direction:column;gap:10px;padding:12px 14px;border:0.5px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}
.zct-password{font-family:var(--dsh-font-family-code,ui-monospace,monospace);font-size:16px;line-height:1.6;word-break:break-all;color:var(--dsw-alias-label-primary)}
.zct-strength{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.zct-strength-bars{display:flex;gap:3px;flex:none}
.zct-bar{width:26px;height:5px;border-radius:2px;background:var(--dsw-alias-border-l2)}
.zct-bar-on.zct-level-0{background:var(--dsw-alias-state-error-primary)}
.zct-bar-on.zct-level-1{background:var(--dsw-alias-state-warn-primary)}
.zct-bar-on.zct-level-2,.zct-bar-on.zct-level-3{background:var(--dsw-alias-state-success-primary)}
.zct-range{width:100%;accent-color:var(--dsw-alias-brand-primary)}
.zct-code{margin:0;padding:10px 12px;border-radius:10px;background:var(--dsw-alias-bg-layer-1);border:0.5px solid var(--dsw-alias-border-l1);font-family:var(--dsh-font-family-code,ui-monospace,monospace);font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-all;color:var(--dsw-alias-label-primary);max-height:32vh;overflow:auto}
.zct-hit{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-label-primary-inverted,#fff));border-radius:3px;padding:0 1px}
.zct-match-list{display:flex;flex-direction:column;gap:4px;max-height:24vh;overflow:auto}
.zct-match{display:flex;align-items:center;flex-wrap:wrap;gap:6px;font-size:12px;padding:4px 6px;border-radius:6px;background:var(--dsw-alias-bg-layer-1)}
.zct-match-index{flex:none;color:var(--dsw-alias-label-tertiary);font-size:11px;font-variant-numeric:tabular-nums}
.zct-match-value{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--dsh-font-family-code,ui-monospace,monospace)}
.zct-match-groups{display:flex;flex-wrap:wrap;gap:4px;flex:none}
.zct-chip-mini{height:20px;padding:0 6px;font-size:11px;cursor:default}
.zct-diff{max-height:40vh}
.zct-diff-add{color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 10%,transparent)}
.zct-diff-del{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent)}
.zct-diff-same{color:var(--dsw-alias-label-secondary)}
.zct-error{margin:0;color:var(--dsw-alias-state-error-primary);font-size:12px}
.zct-hint-line{margin:0;color:var(--dsw-alias-label-tertiary);font-size:11px}
.zct-color-line{display:flex;align-items:center;gap:10px}
.zct-color-key{width:44px;flex:none;font-size:11px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}
.zct-color-value{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.zct-color-input{width:38px;height:30px;padding:0;border:0.5px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;cursor:pointer;flex:none}
.zct-swatch{flex:none;position:relative;width:110px;height:110px;border-radius:14px;border:0.5px solid var(--dsw-alias-border-l2);overflow:hidden;background-image:linear-gradient(45deg,rgba(127,127,127,.18) 25%,transparent 25%),linear-gradient(-45deg,rgba(127,127,127,.18) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,rgba(127,127,127,.18) 75%),linear-gradient(-45deg,transparent 75%,rgba(127,127,127,.18) 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0}
.zct-swatch-fill{position:absolute;inset:0}
.zct-color-list{display:flex;flex-direction:column;gap:8px;flex:1;min-width:0}
.zct-uuid-row{display:flex;align-items:center;gap:10px}
.zct-uuid-value{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.zct-number{width:72px;flex:none}
@media (max-width:720px){
.zct-backdrop{padding:12px}
.zct-body{flex-direction:column}
.zct-rail{width:auto;flex-direction:row;align-items:center;overflow-x:auto;border-right:none;border-bottom:0.5px solid var(--dsw-alias-border-l1);padding:8px}
.zct-rail-search,.zct-rail-label{display:none}
.zct-tool-list{flex-direction:row}
.zct-tool-item{width:auto;white-space:nowrap;flex:none}
.zct-main-head{padding:12px 16px 6px}
.zct-pane{padding:6px 16px 16px}
.zct-grid2{grid-template-columns:minmax(0,1fr)}
.zct-about-grid{flex-direction:column}
.zct-about-qr{align-self:center}
.zct-foot-brandtext{display:none}
}
`

    function FooterAction(props) {
      const wide = props.wide === true
      const t = typeof props.t === 'function' ? props.t : identity
      const panelOpen = useStore((snapshot) => snapshot.open)
      const prefs = useStore((snapshot) => snapshot.prefs)
      const [hover, setHover] = useState(false)
      const [menuOpen, setMenuOpen] = useState(false)
      const [anchor, setAnchor] = useState(null)
      const buttonRef = useRef(null)
      const menuRef = useRef(null)
      const label = t('action.label')

      useEffect(() => {
        if (panelOpen) setMenuOpen(false)
      }, [panelOpen])

      useEffect(() => {
        if (!menuOpen) return undefined
        const button = buttonRef.current
        if (button !== null) {
          const rect = button.getBoundingClientRect()
          const width = 248
          setAnchor({
            left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
            bottom: window.innerHeight - rect.top + 6,
          })
        }
        const frame = window.requestAnimationFrame(() => {
          const menu = menuRef.current
          if (menu === null) return
          const first = menu.querySelector('[role="menuitem"]')
          if (first !== null) first.focus()
        })
        const onPointerDown = (event) => {
          const menu = menuRef.current
          const btn = buttonRef.current
          const target = event.target
          if (menu !== null && menu.contains(target)) return
          if (btn !== null && btn.contains(target)) return
          setMenuOpen(false)
        }
        const onKeyDown = (event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            setMenuOpen(false)
            if (buttonRef.current !== null) buttonRef.current.focus()
            return
          }
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
          const menu = menuRef.current
          if (menu === null || !menu.contains(document.activeElement)) return
          const items = Array.from(menu.querySelectorAll('[role="menuitem"]'))
          if (items.length === 0) return
          event.preventDefault()
          const index = items.indexOf(document.activeElement)
          const next = event.key === 'ArrowDown'
            ? items[(index + 1) % items.length]
            : items[(index - 1 + items.length) % items.length]
          next.focus()
        }
        document.addEventListener('pointerdown', onPointerDown, true)
        document.addEventListener('keydown', onKeyDown, true)
        return () => {
          window.cancelAnimationFrame(frame)
          document.removeEventListener('pointerdown', onPointerDown, true)
          document.removeEventListener('keydown', onKeyDown, true)
        }
      }, [menuOpen])

      const openFromMenu = (tab) => {
        setMenuOpen(false)
        openToolbox(tab)
        if (buttonRef.current !== null) returnFocus = buttonRef.current
      }

      const menuItem = (tool) => h('button', {
        key: tool.id,
        type: 'button',
        role: 'menuitem',
        className: 'zct-menu-item',
        onClick: () => { openFromMenu(tool.id) },
      },
      h('span', { className: 'zct-menu-icon' }, h(tool.icon)),
      h('span', { className: 'zct-menu-name' }, t(tool.title)),
      (prefs.usage[tool.id] || 0) > 0
        ? h('span', { className: 'zct-menu-count' }, String(prefs.usage[tool.id]))
        : null)

      const menu = menuOpen && anchor !== null
        ? h(Fragment, null,
          h('style', { key: 'zct-menu-style' }, MENU_CSS),
          h('div', {
            ref: menuRef,
            key: 'zct-menu',
            className: 'zct-menu',
            role: 'menu',
            'aria-label': label,
            style: { left: anchor.left, bottom: anchor.bottom },
          },
          h('div', { className: 'zct-menu-head' },
            h('span', { className: 'zct-menu-brandmark' }, h(ToolboxIcon, { size: 14 })),
            h('span', null, t('menu.title'))),
          menuTools(prefs).map(menuItem),
          h('div', { className: 'zct-menu-sep' }),
          h('button', {
            type: 'button',
            role: 'menuitem',
            className: 'zct-menu-item',
            onClick: () => {
              if (state.tab === SETTINGS_ID) openFromMenu(TOOLS[0].id)
              else openFromMenu()
            },
          },
          h('span', { className: 'zct-menu-icon' }, h(GridIcon)),
          h('span', { className: 'zct-menu-name' }, t('menu.all'))),
          h('button', {
            type: 'button',
            role: 'menuitem',
            className: 'zct-menu-item',
            onClick: () => { openFromMenu(SETTINGS_ID) },
          },
          h('span', { className: 'zct-menu-icon' }, h(SettingsIcon)),
          h('span', { className: 'zct-menu-name' }, t('menu.settings'))),
          h('button', {
            type: 'button',
            role: 'menuitem',
            className: 'zct-menu-item',
            onClick: () => { openFromMenu(ABOUT_ID) },
          },
          h('span', { className: 'zct-menu-icon' }, h(InfoIcon)),
          h('span', { className: 'zct-menu-name' }, t('menu.about'))),
          h('button', {
            type: 'button',
            role: 'menuitem',
            className: 'zct-menu-item',
            onClick: () => {
              setMenuOpen(false)
              if (buttonRef.current !== null) buttonRef.current.focus()
              openExternal(BRAND_GITHUB)
            },
          },
          h('span', { className: 'zct-menu-icon' }, h(GitHubIcon)),
          h('span', { className: 'zct-menu-name' }, t('menu.github')))))
        : null

      const text = wide
        ? h('span', {
          style: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: '0',
          },
        }, label)
        : null

      const chevron = wide
        ? h('svg', {
          width: 12,
          height: 12,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          style: { marginLeft: 'auto', flex: 'none', opacity: 0.55, transform: menuOpen ? 'rotate(180deg)' : undefined },
          'aria-hidden': 'true',
        }, h('path', { d: 'm6 9 6 6 6-6' }))
        : null

      return h(Fragment, null,
        h('button', {
          ref: buttonRef,
          type: 'button',
          className: 'zct-footer',
          'aria-label': label,
          'aria-keyshortcuts': HOTKEY_ARIA,
          'aria-haspopup': 'menu',
          'aria-expanded': menuOpen,
          title: t('action.title'),
          onClick: () => { setMenuOpen(!menuOpen) },
          onPointerEnter: () => { setHover(true) },
          onPointerLeave: () => { setHover(false) },
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: wide ? 'flex-start' : 'center',
            gap: wide ? 8 : 0,
            width: wide ? 'calc(100% + 4px)' : '36px',
            height: wide ? '42px' : '36px',
            margin: wide ? '0 -2px' : '0',
            padding: wide ? '0 10px 0 8px' : '0',
            boxSizing: 'border-box',
            border: 'none',
            borderRadius: wide ? '12px' : '50%',
            background: hover || menuOpen ? 'var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))' : 'transparent',
            color: 'var(--dsw-alias-label-primary)',
            font: 'inherit',
            fontSize: '14px',
            lineHeight: '20px',
            cursor: 'pointer',
            flex: 'none',
            overflow: 'hidden',
          },
        }, h(ToolboxIcon, { size: 18 }), text, chevron),
        menu)
    }

    function ToolboxOverlay(props) {
      const open = useStore((snapshot) => snapshot.open)
      const tab = useStore((snapshot) => snapshot.tab)
      const filter = useStore((snapshot) => snapshot.filter)
      const prefs = useStore((snapshot) => snapshot.prefs)
      const t = typeof props.t === 'function' ? props.t : identity
      const dialogRef = useRef(null)
      const searchRef = useRef(null)

      useEffect(() => {
        if (!open) return undefined
        const previous = returnFocus
        const node = dialogRef.current
        const frame = window.requestAnimationFrame(() => {
          if (searchRef.current !== null) searchRef.current.focus()
        })
        const onKeyDown = (event) => {
          if (node === null || !node.contains(document.activeElement)) return
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            closeToolbox()
            return
          }
          if (event.key !== 'Tab') return
          const focusable = Array.from(node.querySelectorAll('button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'))
            .filter(element => !element.disabled && element.offsetParent !== null)
          if (focusable.length === 0) return
          const first = focusable[0]
          const last = focusable[focusable.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }
        document.addEventListener('keydown', onKeyDown, true)
        return () => {
          window.cancelAnimationFrame(frame)
          document.removeEventListener('keydown', onKeyDown, true)
          if (previous !== null && previous !== undefined && typeof previous.focus === 'function' && previous.isConnected !== false) previous.focus()
          returnFocus = null
        }
      }, [open])

      if (!open) return null

      const settingsView = tab === SETTINGS_ID
      const aboutView = tab === ABOUT_ID
      const current = settingsView || aboutView ? null : (TOOLS.find(tool => tool.id === tab) || TOOLS[0])
      const visibleToolId = aboutView ? ABOUT_ID : settingsView ? SETTINGS_ID : current.id
      const query = filter.trim().toLowerCase()
      const visible = prefs.order
        .map(id => TOOLS.find(tool => tool.id === id))
        .filter(tool => tool !== undefined)
        .filter(tool => query === ''
          || t(tool.title).toLowerCase().includes(query)
          || t(tool.desc).toLowerCase().includes(query)
          || tool.id.includes(query))

      const selectTab = (tool) => {
        setTab(tool.id)
        window.requestAnimationFrame(() => {
          const node = document.getElementById('zct-tab-' + tool.id)
          if (node !== null) node.focus()
        })
      }

      const selectSettings = () => {
        setTab(SETTINGS_ID)
        window.requestAnimationFrame(() => {
          const node = document.getElementById('zct-tab-settings')
          if (node !== null) node.focus()
        })
      }

      const selectAbout = () => {
        setTab(ABOUT_ID)
        window.requestAnimationFrame(() => {
          const node = document.getElementById('zct-tab-about')
          if (node !== null) node.focus()
        })
      }

      const onTabKeyDown = (event, tool) => {
        const index = visible.findIndex(item => item.id === tool.id)
        if (index === -1) return
        let next = null
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = visible[(index + 1) % visible.length]
        else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = visible[(index - 1 + visible.length) % visible.length]
        else if (event.key === 'Home') next = visible[0]
        else if (event.key === 'End') next = visible[visible.length - 1]
        if (next !== null) {
          event.preventDefault()
          selectTab(next)
        }
      }

      return h(Fragment, null,
        h('style', { key: 'zct-style' }, CSS),
        h('div', {
          key: 'zct-backdrop',
          className: 'zct-backdrop',
          onClick: (event) => { if (event.target === event.currentTarget) closeToolbox() },
        },
        h('div', {
          ref: dialogRef,
          className: 'zct-dialog',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': t('panel.title'),
          'data-shortcut-modal': MODAL_ID,
        },
        h('header', { className: 'zct-head' },
          h('div', { className: 'zct-brand' },
            h('span', { className: 'zct-brand-mark' }, h(ToolboxIcon, { size: 20 })),
            h('div', null,
              h('div', { className: 'zct-brand-title' }, t('panel.title')),
              h('div', { className: 'zct-brand-sub' }, t('panel.subtitle')))),
          h('div', { className: 'zct-head-right' },
            h('button', {
              type: 'button',
              className: 'zct-close',
              'aria-label': t('panel.close'),
              title: t('panel.close'),
              onClick: closeToolbox,
            }, h('svg', {
              width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
              stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', 'aria-hidden': 'true',
            }, h('path', { d: 'M6 6l12 12' }), h('path', { d: 'M18 6 6 18' }))))),

        h('div', { className: 'zct-body' },
          h('aside', { className: 'zct-rail' },
            h('input', {
              ref: searchRef,
              className: 'zct-input zct-rail-search',
              value: filter,
              placeholder: t('panel.search'),
              'aria-label': t('panel.search'),
              spellCheck: false,
              onChange: (event) => { setFilter(event.target.value) },
            }),
            h('div', { className: 'zct-rail-label' }, t('panel.tools')),
            h('div', { className: 'zct-tool-list', role: 'tablist', 'aria-label': t('panel.tools') },
              visible.map(tool => h('button', {
                key: tool.id,
                type: 'button',
                role: 'tab',
                id: 'zct-tab-' + tool.id,
                'aria-selected': current !== null && tool.id === current.id,
                'aria-controls': 'zct-panel-' + tool.id,
                tabIndex: current !== null && tool.id === current.id ? 0 : -1,
                className: current !== null && tool.id === current.id ? 'zct-tool-item zct-tool-item-active' : 'zct-tool-item',
                title: t(tool.title),
                onClick: () => { setTab(tool.id) },
                onKeyDown: (event) => { onTabKeyDown(event, tool) },
              },
              h('span', { className: 'zct-tool-icon' }, h(tool.icon)),
              h('span', { className: 'zct-tool-name' }, t(tool.title))))),
            visible.length === 0 ? h('p', { className: 'zct-hint-line' }, t('panel.noMatch')) : null,
            h('div', { className: 'zct-rail-sep' }),
            h('button', {
              type: 'button',
              role: 'tab',
              id: 'zct-tab-settings',
              'aria-selected': settingsView,
              'aria-controls': 'zct-panel-settings',
              tabIndex: settingsView ? 0 : -1,
              className: settingsView ? 'zct-tool-item zct-tool-item-active' : 'zct-tool-item',
              onClick: selectSettings,
            },
            h('span', { className: 'zct-tool-icon' }, h(SettingsIcon)),
            h('span', { className: 'zct-tool-name' }, t('settings.title'))),
            h('button', {
              type: 'button',
              role: 'tab',
              id: 'zct-tab-about',
              'aria-selected': aboutView,
              'aria-controls': 'zct-panel-about',
              tabIndex: aboutView ? 0 : -1,
              className: aboutView ? 'zct-tool-item zct-tool-item-active' : 'zct-tool-item',
              onClick: selectAbout,
            },
            h('span', { className: 'zct-tool-icon' }, h(InfoIcon)),
            h('span', { className: 'zct-tool-name' }, t('about.title')))),

          h('main', { className: 'zct-main' },
            h('div', { className: 'zct-main-head' },
              h('h2', { className: 'zct-main-title' }, aboutView ? t('about.title') : settingsView ? t('settings.title') : t(current.title)),
              h('p', { className: 'zct-main-desc' }, aboutView ? t('about.desc') : settingsView ? t('settings.desc') : t(current.desc))),
            h('div', { className: 'zct-pane' },
              TOOLS.map(tool => h('div', {
                key: tool.id,
                className: 'zct-tool-panel',
                role: 'tabpanel',
                id: 'zct-panel-' + tool.id,
                'aria-labelledby': 'zct-tab-' + tool.id,
                hidden: tool.id !== visibleToolId,
              }, h(tool.Component, { t }))),
              h('div', {
                className: 'zct-tool-panel',
                role: 'tabpanel',
                id: 'zct-panel-settings',
                'aria-labelledby': 'zct-tab-settings',
                hidden: !settingsView,
              }, h(SettingsPane, { t })),
              h('div', {
                className: 'zct-tool-panel',
                role: 'tabpanel',
                id: 'zct-panel-about',
                'aria-labelledby': 'zct-tab-about',
                hidden: !aboutView,
              }, h(AboutPane, { t }))))),

        h('footer', { className: 'zct-foot' },
          h('span', { className: 'zct-shortcuts' },
            h('span', { className: 'zct-kbd', title: t('panel.hotkeyHint') }, HOTKEY),
            h('span', null, t('panel.toggle')),
            h('span', { className: 'zct-sep-dot' }, '·'),
            h('span', { className: 'zct-kbd' }, 'Esc'),
            h('span', null, t('panel.esc'))),
          h('div', { className: 'zct-foot-brand' },
            h('button', {
              type: 'button',
              className: 'zct-foot-qr',
              title: t('footer.qrHint'),
              'aria-label': t('footer.qrHint'),
              onClick: selectAbout,
            }, h('img', { src: WECHAT_QR, width: 36, height: 36, alt: '' })),
            h('div', { className: 'zct-foot-brandtext' },
              h('a', {
                className: 'zct-link',
                href: BRAND_HOME,
                target: '_blank',
                rel: 'noreferrer noopener',
                onClick: (event) => {
                  event.preventDefault()
                  window.open(BRAND_HOME, '_blank', 'noopener,noreferrer')
                },
              }, BRAND_SITE_LABEL),
              h('button', {
                type: 'button',
                className: 'zct-foot-wechat',
                onClick: selectAbout,
              }, t('footer.wechat'))))))))
    }

    /* ---------------------------------------------------------------- plugin */

    function apply(ctx) {
      const translate = ctx.locale.bind(NS)
      ctx.effect(() => ctx.locale.register(NS, 'en', EN), 'zicode-tools: en dictionary')
      ctx.effect(() => ctx.locale.register(NS, 'zh', ZH), 'zicode-tools: zh dictionary')

      ctx.effect(() => {
        try {
          return ctx.shortcuts.register({
            id: 'zicode-tools.open',
            label: () => translate('shortcut.label'),
            aliases: ['toolbox', 'tools', '字码', '工具'],
            defaults: {
              'desktop:macos': { code: 'KeyZ', modifiers: ['alt', 'shift'] },
              'desktop:windows': { code: 'KeyZ', modifiers: ['alt', 'shift'] },
              'desktop:linux': { code: 'KeyZ', modifiers: ['alt', 'shift'] },
              'web:macos': { code: 'KeyZ', modifiers: ['primary', 'alt'] },
              'web:windows': { code: 'KeyZ', modifiers: ['primary', 'alt'] },
            },
            regions: ['page', 'editable'],
            modals: [MODAL_ID],
            resolve: () => ({
              status: 'handled',
              run: () => { toggleToolbox() },
            }),
          })
        } catch (error) {
          console.error('[zicode-tools] shortcut registration failed:', error)
          return () => {}
        }
      }, 'zicode-tools: shortcut')

      ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
        name: 'sidebar.footer.action',
        id: 'zicode-tools',
        order: -10,
        locale: NS,
        label: () => translate('action.label'),
      }, FooterAction))

      ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'zicode-tools',
        order: 10,
        locale: NS,
      }, ToolboxOverlay))
    }

    /* Bundled ZiCode WeChat official-account QR, source: https://zicode.com/qrcode_zicode.jpg */
    const WECHAT_QR = 'data:image/jpeg;base64,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'

    return {
      inject: ['slots', 'locale', 'shortcuts'],
      apply,
    }
  },
})
