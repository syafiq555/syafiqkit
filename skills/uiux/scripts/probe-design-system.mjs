#!/usr/bin/env node
// probe-design-system: what tokens and shared components does this repo already have, and how much raw
// styling has leaked past them? Read-only, deterministic, no network.
//
//   node probe-design-system.mjs [repo-root=.] [--json]
//
// Node 22+, no npm. Skips node_modules, vendor, dist, build, public/build, .git and test folders.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { resolve, join, relative, basename, extname, dirname, sep } from 'node:path';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const rootArg = args.find((a) => !a.startsWith('--')) || '.';
const root = resolve(rootArg);
if (!existsSync(root) || !statSync(root).isDirectory()) { console.error('Not a directory: ' + root); process.exit(2); }

const SKIP_DIRS = new Set(['node_modules', 'vendor', 'dist', 'build', '.git', '.next', '.nuxt', '.svelte-kit', '.turbo', '.cache', 'coverage', 'storage', 'bootstrap', 'tmp', '.idea', '.vscode', '.claude', '.venv', '__pycache__', 'test-results', 'playwright-report', 'e2e', 'tests', 'test', '__tests__', '__mocks__', 'cypress', 'stories', '.storybook', 'android', 'ios', 'docs', 'tasks', 'wp-admin', 'wp-includes']);
const SKIP_PATHS = ['public/build', 'public/vendor', 'public/js', 'public/css', 'public/assets', 'public/dist', 'wp-content/plugins', 'wp-content/uploads', 'wp-content/themes/twentytwentythree', 'wp-content/themes/twentytwentyfour', 'wp-content/themes/twentytwentyfive', 'wp-content/themes/astra', 'wp-content/themes/storefront', 'wp-content/themes/hello-elementor', 'wp-includes', 'wp-admin'];
const SRC_EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.vue', '.svelte', '.css', '.scss', '.less', '.html', '.astro', '.mdx']);
const MAX_BYTES = 400 * 1024;

const files = [];
const claudeDocs = [];
const configFiles = [];
const stack = [root];
while (stack.length) {
  const dir = stack.pop();
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isSymbolicLink()) continue;
    const rel = relative(root, full).split(sep).join('/');
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || (e.name.startsWith('.') && e.name !== '.') || SKIP_PATHS.some((p) => rel === p || rel.endsWith('/' + p))) continue;
      stack.push(full);
      continue;
    }
    if (/^(CLAUDE|AGENTS)(\.local)?\.md$/.test(e.name)) claudeDocs.push(rel);
    if (/^(package\.json|composer\.json|components\.json|tailwind\.config\.[cm]?[jt]s|eslint\.config\.[cm]?[jt]s|\.oxlintrc(\.json)?|oxlint\.config\.[cm]?[jt]s|biome\.jsonc?|\.eslintrc(\.[a-z]+)?|\.stylelintrc(\.[a-z]+)?|stylelint\.config\.[cm]?[jt]s|postcss\.config\.[cm]?[jt]s|vite\.config\.[cm]?[jt]s)$/.test(e.name)) configFiles.push(rel);
    const isBlade = e.name.endsWith('.blade.php');
    const ext = extname(e.name).toLowerCase();
    if (!isBlade && !SRC_EXT.has(ext)) continue;
    if (/\.min\.|\.d\.ts$|\.map$|\.stories\./.test(e.name) || /\.(test|spec)\.[jt]sx?$/.test(e.name)) continue;
    files.push({ rel, full, ext: isBlade ? '.blade' : ext });
  }
}

// ---- stack ----
const deps = {};
const stackInfo = { frameworks: new Set(), tailwind: null, uiLibs: new Set(), shadcn: false, packageFiles: [] };
for (const rel of configFiles.filter((f) => /(^|\/)package\.json$/.test(f) && f.split('/').length <= 4)) {
  try { const p = JSON.parse(readFileSync(join(root, rel), 'utf8')); Object.assign(deps, p.dependencies, p.devDependencies); stackInfo.packageFiles.push(rel); } catch {}
}
let composerRequire = {};
for (const rel of configFiles.filter((f) => /(^|\/)composer\.json$/.test(f) && f.split('/').length <= 3)) {
  try { const c = JSON.parse(readFileSync(join(root, rel), 'utf8')); Object.assign(composerRequire, c.require, c['require-dev']); } catch {}
}
const has = (n) => Object.keys(deps).some((d) => d === n || (n.endsWith('/') && d.startsWith(n)));
if (has('react')) stackInfo.frameworks.add('react ' + String(deps.react).replace(/^[\^~]/, ''));
if (has('vue')) stackInfo.frameworks.add('vue ' + String(deps.vue).replace(/^[\^~]/, ''));
if (has('svelte')) stackInfo.frameworks.add('svelte');
if (has('next')) stackInfo.frameworks.add('next');
if (has('nuxt')) stackInfo.frameworks.add('nuxt');
if (has('@inertiajs/')) stackInfo.frameworks.add('inertia');
if (has('@refinedev/')) stackInfo.frameworks.add('refine');
if (composerRequire['livewire/livewire']) stackInfo.frameworks.add('livewire');
if (composerRequire['laravel/framework']) stackInfo.frameworks.add('laravel');
if (files.some((f) => f.ext === '.blade')) stackInfo.frameworks.add('blade');
if (has('tailwindcss')) stackInfo.tailwind = String(deps.tailwindcss).replace(/^[\^~]/, '');
else if (has('@tailwindcss/vite') || has('@tailwindcss/postcss')) stackInfo.tailwind = '4 (via plugin)';
for (const [pkg, label] of [['@chakra-ui/react', 'chakra'], ['@mui/material', 'mui'], ['antd', 'antd'], ['bootstrap', 'bootstrap'], ['@mantine/core', 'mantine'], ['@radix-ui/', 'radix'], ['@headlessui/react', 'headlessui'], ['@shadcn/ui', 'shadcn'], ['@ark-ui/', 'ark'], ['styled-components', 'styled-components'], ['@emotion/react', 'emotion'], ['@tabler/icons-react', 'tabler-icons'], ['lucide-react', 'lucide']]) if (has(pkg)) stackInfo.uiLibs.add(label + (deps[pkg] && !pkg.endsWith('/') ? ' ' + String(deps[pkg]).replace(/^[\^~]/, '') : ''));
for (const rel of configFiles.filter((f) => /(^|\/)components\.json$/.test(f))) stackInfo.shadcn = true;
if (stackInfo.shadcn) stackInfo.uiLibs.add('shadcn');

// ---- token sources (first pass over files) ----
const customProps = {};
const customPropFiles = [];
const themeBlocks = [];
const themeFiles = [];
const tokenFileSet = new Set();
const tailwindConfigs = [];
const THEME_NAME = /(^|\/)(theme|themes|tokens?|design-tokens?|colors?|palette|variables)(\/index)?\.(ts|tsx|js|mjs|css|scss|json)$/i;
const THEME_CALL = /\b(extendTheme|createTheme|createSystem|defineConfig\(\{[^}]*theme|defineTokens|createStitches|configureTheme)\s*\(/;
const TW_KEYS = ['colors', 'spacing', 'fontFamily', 'fontSize', 'borderRadius', 'boxShadow', 'screens', 'zIndex', 'maxWidth', 'keyframes', 'animation', 'container', 'transitionDuration', 'lineHeight'];

for (const rel of configFiles.filter((f) => /(^|\/)tailwind\.config\.[cm]?[jt]s$/.test(f))) {
  let text = ''; try { text = readFileSync(join(root, rel), 'utf8'); } catch {}
  tailwindConfigs.push({ file: rel, themeKeys: TW_KEYS.filter((k) => new RegExp('\\b' + k + '\\s*:').test(text)), usesExtend: /\bextend\s*:/.test(text), presets: /\bpresets\s*:/.test(text), plugins: /\bplugins\s*:/.test(text) });
  tokenFileSet.add(rel);
}
const TOKEN_DIR = /^(?!.*wp-content\/themes)(?:.*\/)?(themes?|tokens?|design-tokens?)\//i;

function braceBlock(text, from) {
  const open = text.indexOf('{', from);
  if (open === -1) return '';
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return text.slice(open + 1, i);
  }
  return text.slice(open + 1);
}

const contents = new Map();
for (const f of files) {
  let st; try { st = statSync(f.full); } catch { continue; }
  if (st.size > MAX_BYTES || st.size === 0) continue;
  let text; try { text = readFileSync(f.full, 'utf8'); } catch { continue; }
  if (text.length > 2000 && text.split('\n').length < 5) continue;
  contents.set(f.rel, text);
  if (TOKEN_DIR.test(f.rel)) { tokenFileSet.add(f.rel); if (!themeFiles.some((t) => t.file === dirname(f.rel) + '/')) themeFiles.push({ file: dirname(f.rel) + '/', via: 'theme/tokens directory' }); }
  if (/\.(css|scss|less)$/.test(f.rel)) {
    let n = 0;
    for (const m of text.matchAll(/(?:^|[;{\s])(--[a-zA-Z0-9_-]+)\s*:/g)) {
      n++;
      const prefix = m[1].split('-').slice(0, 3).join('-');
      customProps[prefix] = (customProps[prefix] || 0) + 1;
    }
    if (n) customPropFiles.push({ file: f.rel, count: n });
    if (n >= 10) tokenFileSet.add(f.rel);
    for (const m of text.matchAll(/@theme\b[^{]*/g)) {
      const block = braceBlock(text, m.index);
      const vars = (block.match(/--[a-zA-Z0-9_-]+\s*:/g) || []).length;
      themeBlocks.push({ file: f.rel, vars, inline: /inline/.test(m[0]) });
      tokenFileSet.add(f.rel);
    }
  }
  if (THEME_NAME.test(f.rel) || THEME_CALL.test(text)) {
    const call = (text.match(THEME_CALL) || [])[1];
    if (THEME_NAME.test(f.rel) || call) { themeFiles.push({ file: f.rel, via: call ? call.replace(/\(.*/, '') : 'filename' }); tokenFileSet.add(f.rel); }
  }
}
customPropFiles.sort((a, b) => b.count - a.count);

// ---- shared component directories ----
const COMP_DIR = /(^|\/)(components\/ui|components\/atoms|components\/primitives|components\/common|components\/shared|components|Components|ui|atoms|primitives|design-system|views\/components)(\/|$)/;
const compFileRe = /\.(tsx|jsx|vue|svelte|blade)$/;
const components = new Map();
for (const f of files) {
  if (!compFileRe.test(f.rel) && !f.rel.endsWith('.blade.php')) continue;
  const m = COMP_DIR.exec(f.rel);
  if (!m) continue;
  const dirOf = f.rel.slice(0, m.index + m[0].length).replace(/\/$/, '');
  const inner = f.rel.slice(dirOf.length + 1);
  if (inner.split('/').length > 2) continue;
  let name = basename(f.rel).replace(/\.blade\.php$|\.(tsx|jsx|vue|svelte)$/, '');
  if (/^index$/i.test(name)) name = basename(dirname(f.rel));
  if (/\.(test|spec|stories)$/.test(name)) continue;
  const key = dirOf + '::' + name;
  if (!components.has(key)) components.set(key, { name, dir: dirOf, file: f.rel, uses: new Set() });
}
const compDirs = {};
for (const c of components.values()) compDirs[c.dir] = (compDirs[c.dir] || 0) + 1;

// a blade component is only ever used as <x-name>, a JS one only through an import: the two never share a match,
// so a blade "list" is not credited with every `import { list }` in the app
const byName = new Map();
for (const c of components.values()) { const k = (c.file.endsWith('.blade.php') ? 'blade|' : 'js|') + c.name.toLowerCase().replace(/[-_]/g, ''); if (!byName.has(k)) byName.set(k, []); byName.get(k).push(c); }
const importRe = /import\s+(?:type\s+)?([^'";]*?)\s+from\s+['"]([^'"]+)['"]/g;
const bladeRe = /<x-([a-zA-Z0-9_.:-]+)/g;
for (const [rel, text] of contents) {
  const seen = new Set();
  if (rel.endsWith('.blade.php')) {
    for (const m of text.matchAll(bladeRe)) seen.add('blade|' + m[1].split('.').pop().toLowerCase().replace(/[-_]/g, ''));
  } else if (/\.(js|jsx|ts|tsx|mjs|vue|svelte|astro)$/.test(rel)) {
    for (const m of text.matchAll(importRe)) {
      const names = m[1].replace(/[{}*]/g, ' ').split(/[\s,]+/).filter((x) => x && x !== 'as' && x !== 'type');
      const modBase = basename(m[2]).replace(/\.(tsx|jsx|vue|svelte|js|ts)$/, '');
      const modTail = /^index$/i.test(modBase) ? basename(dirname(m[2])) : modBase;
      // an import credits a local component only: `List` from '@chakra-ui/react' is a package's, not ours
      const first = m[2].startsWith('@') && !m[2].startsWith('@/') ? m[2].split('/').slice(0, 2).join('/') : m[2].split('/')[0];
      const local = /^(\.|@\/|~\/|#|\/)/.test(m[2]) || !(first in deps);
      if (!local) continue;
      seen.add('js|' + modTail.toLowerCase().replace(/[-_]/g, ''));
      for (const n of names) if (/^[A-Z]/.test(n)) seen.add('js|' + n.toLowerCase().replace(/[-_]/g, ''));
    }
  }
  for (const k of seen) { const hit = byName.get(k); if (hit) for (const c of hit) if (c.file !== rel) c.uses.add(rel); }
}
const merged = new Map();
for (const c of components.values()) {
  const k = (c.file.endsWith('.blade.php') ? 'blade|' : 'js|') + c.name;
  const prev = merged.get(k);
  if (!prev || c.uses.size > prev.importSites || (c.uses.size === prev.importSites && c.dir.length > prev.dir.length)) merged.set(k, { name: c.name, dir: c.dir, importSites: c.uses.size });
}
const componentList = [...merged.values()].sort((a, b) => b.importSites - a.importSites).slice(0, 20);

// ---- raw values per file ----
const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])/g;
const FUNC_COLOR = /\b(?:rgba?|hsla?)\(/g;
const ARBITRARY = /(?:^|[\s"'`:{(])(?:[a-z0-9-]+:)*-?(?!data-|aria-|group-|peer-|supports-|has-|min-|max-|nth-|in-|not-)[a-z][a-z0-9]*(?:-[a-z0-9]+)*-\[[^\]\s]+\]/g;
const STYLE_ATTR = /(?:\bstyle\s*=\s*(?:\{\{?|["'])|:style\s*=)/g;
const STYLE_PX = /\b\d+(?:\.\d+)?px\b|\b(?:width|height|margin|padding|top|left|right|bottom|fontSize|gap|borderRadius|minWidth|maxWidth|minHeight|maxHeight|lineHeight)[A-Za-z]*\s*:\s*\d+(?![\d%a-z])/g;
const PROP_LITERAL = /\b(?:bg|color|borderColor|fontSize|w|h|minH|maxH|minW|maxW|p|m|px|py|mx|my|mt|mb|ml|mr|pt|pb|pl|pr|gap|borderRadius|boxShadow|lineHeight|width|height|fill|stroke)\s*=\s*\{?\s*["'](?:#[0-9a-fA-F]{3,8}|\d+(?:\.\d+)?px|rgba?\()/g;
// email markup must carry literal colours and inline styles, and static HTML exports are not app source
const EXEMPT = /(^|\/)(emails?|mail|mlp_templates|ds-bundle|fixtures?)(\/|$)|\.review\.html$/i;
const totals = { colorLiteral: 0, arbitrary: 0, inlineStyle: 0, important: 0, styleLiteral: 0, propLiteral: 0 };
const exempt = { files: 0, examples: [] };
const perFile = [];
for (const [rel, text] of contents) {
  if (tokenFileSet.has(rel)) continue;
  if (EXEMPT.test(rel) || (rel.endsWith('.html') && !/(^|\/)(src|app|resources)\//.test(rel))) { exempt.files++; if (exempt.examples.length < 3) exempt.examples.push(rel); continue; }
  const isCss = /\.(css|scss|less)$/.test(rel);
  let scan = text;
  if (isCss) scan = text.split('\n').filter((l) => !/^\s*--[\w-]+\s*:/.test(l)).join('\n');
  let colorLiteral = 0;
  for (const m of scan.matchAll(HEX)) {
    const before = scan.slice(Math.max(0, m.index - 10), m.index);
    if (/href\s*=\s*["']?$|to\s*=\s*["']?$|url\(\s*["']?$|id\s*=\s*["']?$|\(\s*["']$/.test(before) && !/color|fill|stroke|background/i.test(scan.slice(Math.max(0, m.index - 40), m.index))) continue;
    colorLiteral++;
  }
  colorLiteral += (scan.match(FUNC_COLOR) || []).length;
  const arbitrary = isCss ? 0 : (scan.match(ARBITRARY) || []).length;
  const inlineStyle = isCss ? 0 : (scan.match(STYLE_ATTR) || []).length;
  const important = (scan.match(/!important/g) || []).length;
  let styleLiteral = 0;
  if (!isCss) for (const m of scan.matchAll(STYLE_ATTR)) styleLiteral += (scan.slice(m.index, m.index + 400).match(STYLE_PX) || []).length;
  const propLiteral = /\.(tsx|jsx|vue|svelte)$/.test(rel) ? (scan.match(PROP_LITERAL) || []).length : 0;
  const sum = colorLiteral + arbitrary + inlineStyle + important + styleLiteral + propLiteral;
  totals.colorLiteral += colorLiteral; totals.arbitrary += arbitrary; totals.inlineStyle += inlineStyle; totals.important += important; totals.styleLiteral += styleLiteral; totals.propLiteral += propLiteral;
  if (sum) perFile.push({ file: rel, total: sum, colorLiteral, arbitrary, inlineStyle, important, styleLiteral, propLiteral });
}
perFile.sort((a, b) => b.total - a.total);

// ---- token lint ----
const evidence = [];
const lintConfigs = configFiles.filter((f) => /eslint|stylelint|oxlint|biome|vite\.config/i.test(basename(f)));
const LINT_MARKERS = [/no-raw-values?/, /no-restricted-classes/, /no-restricted-syntax/, /no-restricted-properties/, /tailwindcss\/(no-arbitrary-value|no-custom-classname|enforces-)/, /better-tailwindcss/, /color-no-hex/, /declaration-property-value-(disallowed|allowed)-list/, /declaration-strict-value/, /function-disallowed-list/, /no-restricted-imports/];
// a restricted-syntax rule only counts as a token lint when what follows it talks about colours, styles or tokens
const TOKEN_WORDS = /\b(colou?rs?|hex|style|styles|token|tokens|className|\d*px|raw values?|design.system|arbitrary)\b/i;
const unrelated = [];
const noteHit = (file, re, text) => {
  const all = [...text.matchAll(new RegExp(re.source, 'g'))];
  if (!all.length) return;
  const isRestricted = /no-restricted-(syntax|properties|imports)/.test(all[0][0]);
  const ctxOf = (m) => text.slice(m.index, m.index + 300).replace(/\s+/g, ' ');
  const hit = isRestricted ? all.find((m) => TOKEN_WORDS.test(ctxOf(m))) : all[0];
  if (hit) evidence.push({ file, marker: hit[0] + (isRestricted ? ' (message mentions ' + (TOKEN_WORDS.exec(ctxOf(hit)) || [''])[0] + ')' : '') });
  else unrelated.push({ file, marker: all[0][0] });
};
for (const rel of lintConfigs) {
  let text = ''; try { text = readFileSync(join(root, rel), 'utf8'); } catch {}
  for (const re of LINT_MARKERS) noteHit(rel, re, text);
}
for (const rel of stackInfo.packageFiles) {
  try {
    const p = JSON.parse(readFileSync(join(root, rel), 'utf8'));
    if (p.eslintConfig) { const t = JSON.stringify(p.eslintConfig); for (const re of LINT_MARKERS) noteHit(rel + ' (eslintConfig)', re, t); }
    for (const [name, cmd] of Object.entries(p.scripts || {})) if (/(token|design|style|color|hex).*(lint|check)|(lint|check).*(token|design|color|hex)/i.test(name + ' ' + cmd)) evidence.push({ file: rel + ' scripts.' + name, marker: String(cmd).slice(0, 80) });
  } catch {}
}
const customLintRe = /(^|\/)(?=[^/]*(lint|check|guard|audit))(?=[^/]*(tokens?\b|design|colou?r|hex|style))(?![^/]*csrf)[^/]*\.(m?js|ts|sh)$/i;
const lintScripts = [];
(function findLintScripts() {
  const s = [root];
  while (s.length) {
    const dir = s.pop();
    let entries; try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = join(dir, e.name);
      const rel = relative(root, full).split(sep).join('/');
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) { if (SKIP_DIRS.has(e.name) && !['tests', 'test', 'docs', 'tasks', 'e2e'].includes(e.name) || rel.split('/').length > 4) continue; if (['tests', 'test', 'docs', 'tasks', 'e2e'].includes(e.name)) continue; s.push(full); }
      else if (customLintRe.test(rel)) lintScripts.push(rel);
    }
  }
})();
for (const rel of lintScripts.slice(0, 5)) evidence.push({ file: rel, marker: 'custom lint script' });
const tokenLint = evidence.length ? 'present' : 'absent';

// ---- frontend CLAUDE.md ----
const FRONT_PATH = /(^|\/)(frontend|front-end|web|client|ui|resources\/js|resources\/views|src|apps\/[^/]+)\//i;
const claudeInfo = claudeDocs.map((rel) => {
  let t = ''; try { t = readFileSync(join(root, rel), 'utf8'); } catch {}
  const mentions = /\b(token|atom|design system|tailwind|chakra|component)s?\b/i.test(t);
  return { file: rel, frontend: FRONT_PATH.test(rel) || (rel.split('/').length > 1 && mentions), mentionsDesignSystem: mentions };
}).filter((c) => c.frontend || c.mentionsDesignSystem || c.file.split('/').length === 1);

const result = {
  root,
  stack: { frameworks: [...stackInfo.frameworks], tailwind: stackInfo.tailwind, uiLibs: [...stackInfo.uiLibs], shadcn: stackInfo.shadcn, packageFiles: stackInfo.packageFiles },
  tokens: {
    tailwindConfigs, themeBlocks, themeFiles,
    customProperties: { total: Object.values(customProps).reduce((a, b) => a + b, 0), byPrefix: Object.entries(customProps).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([prefix, count]) => ({ prefix, count })), topFiles: customPropFiles.slice(0, 5) },
  },
  components: { dirs: Object.entries(compDirs).sort((a, b) => b[1] - a[1]).map(([dir, count]) => ({ dir, count })), top: componentList },
  rawValues: { totals, topFiles: perFile.slice(0, 15), filesScanned: contents.size, exemptFiles: exempt },
  tokenLint: { status: tokenLint, evidence, unrelatedMatches: unrelated },
  claudeDocs: claudeInfo,
};

if (asJson) { console.log(JSON.stringify(result, null, 2)); process.exit(0); }

const L = [];
L.push(`probe-design-system  ${root}  (${contents.size} source files scanned)`);
L.push('\nSTACK');
L.push('  frameworks: ' + (result.stack.frameworks.join(', ') || 'none detected'));
L.push('  tailwind:   ' + (result.stack.tailwind || 'no'));
L.push('  ui libs:    ' + (result.stack.uiLibs.join(', ') || 'none detected'));
L.push('\nTOKEN SOURCES');
if (!tailwindConfigs.length && !themeBlocks.length && !themeFiles.length && !customPropFiles.length) L.push('  none found: raw values are the only source of truth here');
for (const t of tailwindConfigs) L.push(`  tailwind config ${t.file}: theme keys [${t.themeKeys.join(', ')}]${t.usesExtend ? ', uses extend' : ''}${t.presets ? ', presets' : ''}`);
for (const b of themeBlocks) L.push(`  @theme${b.inline ? ' inline' : ''} in ${b.file}: ${b.vars} variables`);
for (const t of themeFiles) L.push(`  theme file ${t.file} (via ${t.via})`);
if (result.tokens.customProperties.total) L.push(`  css custom properties: ${result.tokens.customProperties.total} defined; by prefix ${result.tokens.customProperties.byPrefix.map((p) => p.prefix + ' ' + p.count).join(', ')}; main files ${result.tokens.customProperties.topFiles.map((f) => f.file + ' (' + f.count + ')').join(', ')}`);
L.push('\nSHARED COMPONENTS');
if (!result.components.dirs.length) L.push('  no components/ui-style directories found');
else L.push('  dirs: ' + result.components.dirs.map((d) => d.dir + ' (' + d.count + ')').join(', '));
for (const c of componentList) L.push(`  ${String(c.importSites).padStart(4)} import sites  ${c.name}  ${c.dir}`);
L.push('\nRAW VALUES OUTSIDE TOKEN FILES');
L.push(`  totals: colour literals ${totals.colorLiteral}, tailwind arbitrary ${totals.arbitrary}, inline style ${totals.inlineStyle}, !important ${totals.important}, px/number in style props ${totals.styleLiteral}, literal component props (bg="#fff", mt="13px") ${totals.propLiteral}`);
if (exempt.files) L.push(`  (not counted: ${exempt.files} email, static-export or fixture files, e.g. ${exempt.examples.join(', ')})`);
for (const f of perFile.slice(0, 15)) L.push(`  ${String(f.total).padStart(4)}  ${f.file}  (colour ${f.colorLiteral}, props ${f.propLiteral}, arbitrary ${f.arbitrary}, style ${f.inlineStyle}, !important ${f.important}, px ${f.styleLiteral})`);
L.push('\nTOKEN LINT: ' + tokenLint);
for (const e of evidence.slice(0, 8)) L.push(`  ${e.file}: ${e.marker}`);
for (const e of unrelated.slice(0, 3)) L.push(`  (not counted, rule does not mention styling) ${e.file}: ${e.marker}`);
L.push('\nCLAUDE.md / AGENTS.md');
for (const c of claudeInfo) L.push(`  ${c.file}${c.frontend ? '  [frontend]' : ''}`);
if (!claudeInfo.length) L.push('  none');
console.log(L.join('\n'));
