// Integration smoke test: evaluates the Client module with a minimal React stub,
// runs `apply()` against a fake Cordis context, and renders every tool once.
// It does not emulate the browser or verify visuals.
import { readFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const captured = []
globalThis.window = {
  __ModuleLoader__: { load(spec) { captured.push(spec) } },
  dshDesktop: { keyboard: {} },
}
globalThis.document = {
  activeElement: null,
  documentElement: { lang: 'en' },
  addEventListener() {},
  removeEventListener() {},
  getElementById() { return null },
}

const ReactStub = {
  createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
  Fragment: Symbol('Fragment'),
  useState: (value) => [typeof value === 'function' ? value() : value, () => {}],
  useRef: (value) => ({ current: value }),
  useEffect: () => {},
  useMemo: (factory) => factory(),
  useCallback: (fn) => fn,
  useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
}

await import(new URL('client.js', root).href)
if (captured.length !== 1) throw new Error('expected one module registration, got ' + captured.length)
const spec = captured[0]
if (spec.id !== 'dsh-zicode-tools') throw new Error('unexpected module id ' + spec.id)

const moduleExports = spec.factory((name) => {
  if (name === 'react') return ReactStub
  throw new Error('unexpected require ' + name)
})
for (const service of ['slots', 'locale', 'shortcuts']) {
  if (!moduleExports.inject.includes(service)) throw new Error('missing injected service ' + service)
}

const dictionaries = {}
const registrations = []
const ctx = {
  effect(fn, label) {
    const dispose = fn()
    if (typeof dispose !== 'function' && dispose !== undefined) throw new Error('effect ' + label + ' returned ' + typeof dispose)
    return () => {}
  },
  locale: {
    bind: (ns) => (key) => ns + ':' + key,
    register(ns, locale, dict) {
      if (dictionaries[locale] !== undefined) throw new Error('duplicate locale ' + locale)
      dictionaries[locale] = dict
      return () => {}
    },
  },
  shortcuts: {
    register(command) {
      registrations.push({ kind: 'shortcut', command })
      return () => {}
    },
  },
  slots: {
    inject(slot, callback) {
      callback()
      return () => {}
    },
    register(definition, component) {
      registrations.push({ kind: 'slot', definition, component })
      return () => {}
    },
  },
}
moduleExports.apply(ctx)

const shortcut = registrations.find((entry) => entry.kind === 'shortcut')
if (shortcut === undefined) throw new Error('shortcut not registered')
if (shortcut.command.id !== 'zicode-tools.open') throw new Error('unexpected shortcut id')
if (shortcut.command.resolve({ modal: null, region: 'page', target: null }).status !== 'handled') throw new Error('shortcut does not handle input')

const slots = registrations.filter((entry) => entry.kind === 'slot')
if (slots.length !== 2) throw new Error('expected 2 slot registrations, got ' + slots.length)
if (slots[0].definition.name !== 'sidebar.footer.action' || slots[0].definition.id !== 'zicode-tools') throw new Error('footer slot wrong')
if (slots[1].definition.name !== 'shell.overlay') throw new Error('overlay slot wrong')

const en = dictionaries.en
const zh = dictionaries.zh
if (en === undefined || zh === undefined) throw new Error('missing dictionaries: ' + Object.keys(dictionaries))
const enKeys = Object.keys(en)
const missing = enKeys.filter((key) => !(key in zh))
const extra = Object.keys(zh).filter((key) => !(key in en))
if (missing.length > 0) throw new Error('zh missing: ' + missing.join(', '))
if (extra.length > 0) throw new Error('zh extra: ' + extra.join(', '))

const t = (key) => (en[key] === undefined ? key : en[key])
const walk = (node, visit) => {
  if (node === null || node === undefined) return
  if (Array.isArray(node)) { for (const child of node) walk(child, visit); return }
  if (typeof node !== 'object') return
  visit(node)
  if (Array.isArray(node.children)) walk(node.children, visit)
}
const findAll = (rootNode, predicate) => {
  const found = []
  walk(rootNode, (node) => { if (predicate(node)) found.push(node) })
  return found
}

const footer = slots.find((entry) => entry.definition.name === 'sidebar.footer.action')
const overlay = slots.find((entry) => entry.definition.name === 'shell.overlay')

const footerTree = footer.component({ wide: true, t })
const footerButtons = findAll(footerTree, (node) => node.type === 'button')
if (footerButtons.length !== 1) throw new Error('footer expected 1 button, got ' + footerButtons.length)
if (footerButtons[0].props['aria-haspopup'] !== 'dialog') throw new Error('footer button is not a dialog trigger')
if (overlay.component({ t }) !== null) throw new Error('overlay should render null while closed')
footerButtons[0].props.onClick()

const openOverlay = () => {
  const tree = overlay.component({ t })
  if (tree === null) throw new Error('overlay did not open')
  if (findAll(tree, (node) => node.props.className === 'zct-backdrop').length !== 1) throw new Error('backdrop missing')
  const dialog = findAll(tree, (node) => node.props.role === 'dialog')
  if (dialog.length !== 1 || dialog[0].props['aria-modal'] !== 'true') throw new Error('dialog missing aria-modal')
  if (findAll(tree, (node) => node.type === 'style').length !== 1) throw new Error('stylesheet missing')
  return tree
}

const tabs = findAll(openOverlay(), (node) => node.props.role === 'tab')
if (tabs.length !== 8) throw new Error('expected 8 tool tabs, got ' + tabs.length)

const firstTree = openOverlay()
const dialog = findAll(firstTree, (node) => node.props.role === 'dialog')[0]
if (dialog.props['data-shortcut-modal'] !== 'zicode-tools') throw new Error('dialog does not own shortcut modality')

const panels = findAll(firstTree, (node) => node.props.className === 'zct-tool-panel')
if (panels.length !== 8) throw new Error('expected 8 mounted tool panels, got ' + panels.length)
if (panels.filter((panel) => panel.props.hidden === true).length !== 7) throw new Error('exactly one panel should be visible')

const toolNodes = findAll(firstTree, (node) => typeof node.type === 'function' && node.props.t === t)
if (toolNodes.length !== 8) throw new Error('expected 8 tool components, got ' + toolNodes.length)
for (const node of toolNodes) {
  const toolTree = node.type(node.props)
  if (toolTree === null) throw new Error('tool rendered nothing')
  if (findAll(toolTree, () => true).length < 5) throw new Error('tool tree suspiciously small')
}

const asciiTree = toolNodes[0].type(toolNodes[0].props)
if (findAll(asciiTree, (node) => node.type === 'tr').length !== 129) {
  throw new Error('expected 128 ASCII rows plus a header row')
}

for (let index = 0; index < tabs.length; index += 1) {
  findAll(openOverlay(), (node) => node.props.role === 'tab')[index].props.onClick()
  const selected = findAll(openOverlay(), (node) => node.props.role === 'tab' && node.props['aria-selected'] === true)
  if (selected.length !== 1) throw new Error('expected one selected tab at ' + index)
}

const backdrop = findAll(openOverlay(), (node) => node.props.className === 'zct-backdrop')[0]
backdrop.props.onClick({ target: backdrop, currentTarget: backdrop })
if (overlay.component({ t }) !== null) throw new Error('backdrop click did not close the overlay')

const enMeta = JSON.parse(readFileSync(new URL('locale/en.json', root), 'utf8'))
const zhMeta = JSON.parse(readFileSync(new URL('locale/zh.json', root), 'utf8'))
for (const field of ['title', 'description', 'detail']) {
  if (typeof enMeta.meta[field] !== 'string' || typeof zhMeta.meta[field] !== 'string') throw new Error('locale meta missing ' + field)
}

console.log('ok — ' + tabs.length + ' tools, ' + enKeys.length + ' dictionary keys, 2 slots, 1 shortcut')
