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

    /* --------------------------------------------------------------- locale */

    const EN = {
      'action.label': 'Zicode tools',
      'action.title': 'Developer toolbox',
      'shortcut.label': 'Open the Zicode toolbox',
      'panel.title': 'Zicode toolbox',
      'panel.subtitle': 'Local developer utilities',
      'panel.search': 'Search tools',
      'panel.tools': 'Tools',
      'panel.close': 'Close',
      'panel.local': 'Runs locally',
      'panel.noMatch': 'No matching tool',
      'panel.esc': 'to close',
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
    }

    const ZH = {
      'action.label': '字码工具',
      'action.title': '开发者工具箱',
      'shortcut.label': '打开字码工具箱',
      'panel.title': '字码工具箱',
      'panel.subtitle': '本地开发者小工具',
      'panel.search': '搜索工具',
      'panel.tools': '工具',
      'panel.close': '关闭',
      'panel.local': '纯本地运行',
      'panel.noMatch': '没有匹配的工具',
      'panel.esc': '关闭',
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
    }

    /* ---------------------------------------------------------------- store */

    const state = { open: false, tab: 'ascii', filter: '' }
    const listeners = new Set()
    const emit = () => { for (const listener of listeners) listener() }
    const patch = (next) => { Object.assign(state, next); emit() }
    const subscribe = (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    }
    const useStore = (select) => useSyncExternalStore(subscribe, () => select(state))
    const setTab = (tab) => patch({ tab })
    const setFilter = (filter) => patch({ filter })
    let returnFocus = null
    const openToolbox = () => {
      const active = document.activeElement
      returnFocus = active !== null && active !== undefined && active !== document.body ? active : null
      patch({ open: true })
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
      const binary = atob(normalized)
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

    function convertEncoding(mode, direction, text) {
      if (text === '') return { error: 'empty' }
      try {
        if (mode === 'base64') return { value: direction === 'encode' ? utf8ToBase64(text) : base64ToUtf8(text) }
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
      const copyState = useCopy()

      const run = (direction) => {
        const result = convertEncoding(mode, direction, input)
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
            h(CopyButton, { id: 'password', text: generated.password, copyState, t, primary: true }),
            h(Btn, { onClick: () => { setNonce(nonce + 1) } }, t('common.generate')))),
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

    /* --------------------------------------------------------------- toolbox */

    const TOOLS = [
      { id: 'ascii', title: 'tool.ascii.title', desc: 'tool.ascii.desc', icon: AsciiIcon, Component: AsciiTool },
      { id: 'encode', title: 'tool.encode.title', desc: 'tool.encode.desc', icon: EncodeIcon, Component: EncodingTool },
      { id: 'password', title: 'tool.password.title', desc: 'tool.password.desc', icon: PasswordIcon, Component: PasswordTool },
      { id: 'json', title: 'tool.json.title', desc: 'tool.json.desc', icon: JsonIcon, Component: JsonTool },
      { id: 'color', title: 'tool.color.title', desc: 'tool.color.desc', icon: ColorIcon, Component: ColorTool },
      { id: 'timestamp', title: 'tool.timestamp.title', desc: 'tool.timestamp.desc', icon: ClockIcon, Component: TimestampTool },
      { id: 'uuid', title: 'tool.uuid.title', desc: 'tool.uuid.desc', icon: UuidIcon, Component: UuidTool },
      { id: 'hash', title: 'tool.hash.title', desc: 'tool.hash.desc', icon: HashIcon, Component: HashTool },
    ]

    const identity = (key) => key

    const CSS = `
.zct-backdrop{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(9,12,18,.38);pointer-events:auto}
.zct-dialog{display:flex;flex-direction:column;width:min(940px,100%);height:min(640px,100%);min-height:320px;overflow:hidden;border:0.5px solid var(--dsw-alias-border-l1);border-radius:16px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);box-shadow:var(--dsw-elevation-prominent,0 24px 64px rgba(0,0,0,.3));font-family:inherit;font-size:13px;line-height:1.5}
.zct-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 18px;border-bottom:0.5px solid var(--dsw-alias-border-l1)}
.zct-brand{display:flex;align-items:center;gap:10px;min-width:0}
.zct-brand-mark{flex:none;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-on-color,#fff)}
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
.zct-valid{margin:0;color:var(--dsw-alias-state-success-primary);font-size:12px}
.zct-foot{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 18px;border-top:0.5px solid var(--dsw-alias-border-l1);font-size:11px;color:var(--dsw-alias-label-tertiary)}
.zct-foot-local{display:inline-flex;align-items:center;gap:6px}
.zct-dot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-success-primary)}
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
.zct-btn{height:28px;padding:0 12px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}
.zct-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));color:var(--dsw-alias-label-primary)}
.zct-btn:disabled{opacity:.45;cursor:default}
.zct-btn-primary{border-color:transparent;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-on-color,#fff)}
.zct-btn-primary:hover:not(:disabled){background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-on-color,#fff);opacity:.9}
.zct-chip{height:26px;padding:0 10px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}
.zct-chip:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.zct-chip-active{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.zct-segmented{display:flex;flex-wrap:wrap;gap:6px}
.zct-switch-row{display:flex;align-items:center;gap:8px;border:none;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;padding:4px 0;cursor:pointer;text-align:left}
.zct-switch{position:relative;flex:none;width:28px;height:16px;border-radius:999px;background:var(--dsw-alias-border-l2);transition:background .15s}
.zct-switch-on{background:var(--dsw-alias-brand-primary)}
.zct-knob{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:transform .15s}
.zct-switch-on .zct-knob{transform:translateX(12px)}
.zct-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 16px}
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
.zct-code{margin:0;padding:10px 12px;border-radius:10px;background:var(--dsw-alias-bg-layer-1);border:0.5px solid var(--dsw-alias-border-l1);font-family:var(--dsh-font-family-code,ui-monospace,monospace);font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-all;color:var(--dsw-alias-label-primary)}
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
}
`

    function FooterAction(props) {
      const wide = props.wide === true
      const t = typeof props.t === 'function' ? props.t : identity
      const open = useStore((snapshot) => snapshot.open)
      const [hover, setHover] = useState(false)
      const label = t('action.label')
      return h('button', {
        type: 'button',
        className: 'zct-footer',
        'aria-label': label,
        'aria-keyshortcuts': HOTKEY_ARIA,
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        title: t('action.title'),
        onClick: open ? closeToolbox : openToolbox,
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
          background: hover || open ? 'var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))' : 'transparent',
          color: 'var(--dsw-alias-label-primary)',
          font: 'inherit',
          fontSize: '14px',
          lineHeight: '20px',
          cursor: 'pointer',
          flex: 'none',
          overflow: 'hidden',
        },
      },
      h(ToolboxIcon, { size: 18 }),
      wide
        ? h('span', {
          style: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: '0',
          },
        }, label)
        : null)
    }

    function ToolboxOverlay(props) {
      const open = useStore((snapshot) => snapshot.open)
      const tab = useStore((snapshot) => snapshot.tab)
      const filter = useStore((snapshot) => snapshot.filter)
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

      const current = TOOLS.find(tool => tool.id === tab) || TOOLS[0]
      const query = filter.trim().toLowerCase()
      const visible = TOOLS.filter(tool => query === ''
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
            h('span', { className: 'zct-kbd' }, HOTKEY),
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
                'aria-selected': tool.id === current.id,
                'aria-controls': 'zct-panel-' + tool.id,
                tabIndex: tool.id === current.id ? 0 : -1,
                className: tool.id === current.id ? 'zct-tool-item zct-tool-item-active' : 'zct-tool-item',
                title: t(tool.title),
                onClick: () => { setTab(tool.id) },
                onKeyDown: (event) => { onTabKeyDown(event, tool) },
              },
              h('span', { className: 'zct-tool-icon' }, h(tool.icon)),
              h('span', { className: 'zct-tool-name' }, t(tool.title))))),
            visible.length === 0 ? h('p', { className: 'zct-hint-line' }, t('panel.noMatch')) : null),

          h('main', { className: 'zct-main' },
            h('div', { className: 'zct-main-head' },
              h('h2', { className: 'zct-main-title' }, t(current.title)),
              h('p', { className: 'zct-main-desc' }, t(current.desc))),
            h('div', { className: 'zct-pane' },
              TOOLS.map(tool => h('div', {
                key: tool.id,
                className: 'zct-tool-panel',
                role: 'tabpanel',
                id: 'zct-panel-' + tool.id,
                'aria-labelledby': 'zct-tab-' + tool.id,
                hidden: tool.id !== current.id,
              }, h(tool.Component, { t })))))),

        h('footer', { className: 'zct-foot' },
          h('span', null, h('span', { className: 'zct-kbd' }, 'Esc'), ' ' + t('panel.esc')),
          h('span', { className: 'zct-foot-local' }, h('span', { className: 'zct-dot' }), t('panel.local'))))))
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

    return {
      inject: ['slots', 'locale', 'shortcuts'],
      apply,
    }
  },
})
