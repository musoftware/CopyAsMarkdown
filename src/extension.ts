import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

const DEFAULT_IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'out',
  'dist',
  'build',
  'bin',
  'obj',
  '.vs',
  '.next',
  '.nuxt',
  'vendor',
  '.vscode',
  '.idea',
  '__pycache__',
  '.specstory',
  '.spotlight-v100',
  '.trashes',
  '.fseventsd'
]);

const DEFAULT_IGNORED_FILES = new Set([
  '.ds_store',
  'thumbs.db',
  'desktop.ini',
  '.directory',
  '.spotlight-v100',
  '.trashes',
  'ehthumbs.db',
  'ehthumbs_vista.db',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'composer.lock',
  'cargo.lock',
  'gemfile.lock',
  'poetry.lock'
]);

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svgz',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.tar', '.gz', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.pdb', '.nupkg', '.snupkg',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp3', '.mp4', '.mkv', '.avi', '.mov', '.wav', '.flac',
  '.pyc', '.pyo', '.class', '.o', '.obj', '.lock',
  '.db', '.sqlite', '.sqlite3'
]);

const SPECIAL_FILENAMES_MAP: Record<string, string> = {
  'dockerfile': 'dockerfile',
  'containerfile': 'dockerfile',
  'makefile': 'makefile',
  'gnumakefile': 'makefile',
  'cmakelists.txt': 'cmake',
  'jenkinsfile': 'groovy',
  'gemfile': 'ruby',
  'rakefile': 'ruby',
  'vagrantfile': 'ruby',
  'procfile': 'yaml',
  '.editorconfig': 'ini',
  '.gitignore': 'ignore',
  '.npmignore': 'ignore',
  '.dockerignore': 'ignore',
  '.prettierrc': 'json',
  '.eslintrc': 'json'
};

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  // Web & JavaScript Ecosystem
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.ts': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.jsx': 'jsx',
  '.tsx': 'tsx',
  '.html': 'html',
  '.htm': 'html',
  '.xhtml': 'html',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.astro': 'astro',
  '.mdx': 'mdx',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.styl': 'stylus',
  '.stylus': 'stylus',
  '.pcss': 'postcss',
  '.postcss': 'postcss',
  '.wasm': 'wasm',

  // Python & Scientific
  '.py': 'python',
  '.pyw': 'python',
  '.pyi': 'python',
  '.ipynb': 'json',
  '.r': 'r',
  '.rmd': 'markdown',
  '.jl': 'julia',
  '.matlab': 'matlab',

  // C, C++, Objective-C, Assembly
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.c++': 'cpp',
  '.hpp': 'cpp',
  '.hh': 'cpp',
  '.hxx': 'cpp',
  '.h++': 'cpp',
  '.inl': 'cpp',
  '.ipp': 'cpp',
  '.tpp': 'cpp',
  '.m': 'objectivec',
  '.mm': 'objectivec',
  '.s': 'assembly',
  '.asm': 'assembly',
  '.nasm': 'assembly',
  '.cu': 'cuda',
  '.cuh': 'cuda',

  // C#, .NET & JVM Languages
  '.cs': 'csharp',
  '.csx': 'csharp',
  '.sln': 'sln',
  '.slnx': 'xml',
  '.csproj': 'xml',
  '.props': 'xml',
  '.targets': 'xml',
  '.resx': 'xml',
  '.vb': 'vb',
  '.vbs': 'vbscript',
  '.vbproj': 'xml',
  '.fs': 'fsharp',
  '.fsi': 'fsharp',
  '.fsx': 'fsharp',
  '.fsproj': 'xml',
  '.java': 'java',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.scala': 'scala',
  '.sc': 'scala',
  '.groovy': 'groovy',
  '.gvy': 'groovy',
  '.gy': 'groovy',
  '.gsh': 'groovy',
  '.clj': 'clojure',
  '.cljs': 'clojure',
  '.cljc': 'clojure',
  '.edn': 'clojure',

  // Systems & Native Languages
  '.go': 'go',
  '.rs': 'rust',
  '.zig': 'zig',
  '.nim': 'nim',
  '.nims': 'nim',
  '.nimble': 'nim',
  '.d': 'd',
  '.cr': 'crystal',
  '.v': 'v',
  '.odin': 'odin',
  '.jai': 'jai',
  '.ada': 'ada',
  '.adb': 'ada',
  '.ads': 'ada',
  '.f': 'fortran',
  '.f90': 'fortran',
  '.f95': 'fortran',
  '.for': 'fortran',
  '.pas': 'pascal',
  '.pp': 'pascal',
  '.dpr': 'pascal',
  '.cob': 'cobol',
  '.cbl': 'cobol',

  // Functional Languages
  '.hs': 'haskell',
  '.lhs': 'haskell',
  '.elm': 'elm',
  '.erl': 'erlang',
  '.hrl': 'erlang',
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.eex': 'elixir',
  '.heex': 'elixir',
  '.ml': 'ocaml',
  '.mli': 'ocaml',
  '.purs': 'purescript',
  '.lisp': 'lisp',
  '.lsp': 'lisp',
  '.cl': 'lisp',
  '.scm': 'scheme',
  '.ss': 'scheme',
  '.rkt': 'racket',

  // Mobile & Apple / Google Ecosystem
  '.swift': 'swift',
  '.dart': 'dart',

  // Scripting & Dynamic Languages
  '.php': 'php',
  '.phtml': 'php',
  '.blade.php': 'blade',
  '.rb': 'ruby',
  '.rbw': 'ruby',
  '.rake': 'ruby',
  '.gemspec': 'ruby',
  '.lua': 'lua',
  '.pl': 'perl',
  '.pm': 'perl',
  '.t': 'perl',
  '.raku': 'raku',
  '.rakumod': 'raku',
  '.tcl': 'tcl',
  '.awk': 'awk',
  '.sed': 'sed',

  // Shell & DevOps / Cloud / Infrastructure
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.fish': 'fish',
  '.ps1': 'powershell',
  '.psm1': 'powershell',
  '.psd1': 'powershell',
  '.bat': 'bat',
  '.cmd': 'bat',
  '.tf': 'hcl',
  '.tfvars': 'hcl',
  '.hcl': 'hcl',
  '.dockerfile': 'dockerfile',
  '.nix': 'nix',
  '.cmake': 'cmake',

  // Data, Config, Markup & Serialization
  '.json': 'json',
  '.jsonc': 'jsonc',
  '.json5': 'jsonc',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.ini': 'ini',
  '.cfg': 'ini',
  '.conf': 'ini',
  '.properties': 'ini',
  '.env': 'dotenv',
  '.xml': 'xml',
  '.svg': 'xml',
  '.xaml': 'xml',
  '.plist': 'xml',
  '.proto': 'protobuf',
  '.csv': 'csv',
  '.tsv': 'tsv',
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.tex': 'latex',
  '.latex': 'latex',
  '.sty': 'latex',
  '.rst': 'rst',
  '.asciidoc': 'asciidoc',
  '.adoc': 'asciidoc',

  // Databases & Queries
  '.sql': 'sql',
  '.pgsql': 'sql',
  '.plsql': 'sql',
  '.psql': 'sql',
  '.cql': 'cql',
  '.prisma': 'prisma',
  '.graphql': 'graphql',
  '.gql': 'graphql',

  // Graphics & Shaders
  '.glsl': 'glsl',
  '.vert': 'glsl',
  '.frag': 'glsl',
  '.geom': 'glsl',
  '.comp': 'glsl',
  '.tesc': 'glsl',
  '.tese': 'glsl',
  '.hlsl': 'hlsl',
  '.fx': 'hlsl',
  '.fxh': 'hlsl',
  '.wgsl': 'wgsl',

  // Hardware Description Languages
  '.sv': 'systemverilog',
  '.svh': 'systemverilog',
  '.vhd': 'vhdl',
  '.vhdl': 'vhdl',

  // Template Engines
  '.jinja': 'jinja',
  '.jinja2': 'jinja',
  '.j2': 'jinja',
  '.twig': 'twig',
  '.liquid': 'liquid',
  '.handlebars': 'handlebars',
  '.hbs': 'handlebars',
  '.mustache': 'mustache',
  '.pug': 'pug',
  '.jade': 'pug',
  '.haml': 'haml',
  '.ejs': 'ejs'
};

const TREE_SYMBOLS = {
  BRANCH: '├── ',
  LAST: '└── ',
  VERTICAL: '│   ',
  INDENT: '    '
};

interface TreeNode {
  isDirectory: boolean;
  children: Map<string, TreeNode>;
}

function createTreeNode(isDirectory: boolean): TreeNode {
  return {
    isDirectory,
    children: new Map<string, TreeNode>()
  };
}

function getLanguage(filePath: string): string {
  const baseName = path.basename(filePath).toLowerCase();
  if (SPECIAL_FILENAMES_MAP[baseName]) {
    return SPECIAL_FILENAMES_MAP[baseName];
  }
  if (baseName.startsWith('.env')) {
    return 'dotenv';
  }
  if (baseName.endsWith('.blade.php')) {
    return 'blade';
  }
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_LANGUAGE_MAP[ext] || '';
}

function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

function matchesPattern(name: string, pattern: string): boolean {
  const lowerName = name.toLowerCase();
  const lowerPattern = pattern.toLowerCase().trim();
  if (!lowerPattern) {
    return false;
  }
  if (lowerPattern.startsWith('*')) {
    return lowerName.endsWith(lowerPattern.slice(1));
  }
  if (lowerPattern.endsWith('*')) {
    return lowerName.startsWith(lowerPattern.slice(0, -1));
  }
  if (!lowerPattern.includes('.') && (lowerName === lowerPattern || lowerName.startsWith(`${lowerPattern}.`))) {
    return true;
  }
  return lowerName === lowerPattern;
}

function isIgnoredFile(filePath: string, customPatterns: string[] = []): boolean {
  const baseName = path.basename(filePath);
  const lowerBaseName = baseName.toLowerCase();

  if (baseName.startsWith('._')) {
    return true;
  }
  if (lowerBaseName === 'package-lock' || lowerBaseName.startsWith('package-lock.')) {
    return true;
  }
  if (DEFAULT_IGNORED_FILES.has(lowerBaseName)) {
    return true;
  }

  for (const pattern of customPatterns) {
    if (matchesPattern(baseName, pattern)) {
      return true;
    }
  }

  return false;
}

function isIgnoredDirectory(dirPath: string, customPatterns: string[] = []): boolean {
  const baseName = path.basename(dirPath);
  const lowerBaseName = baseName.toLowerCase();

  if (DEFAULT_IGNORED_DIRECTORIES.has(lowerBaseName)) {
    return true;
  }

  for (const pattern of customPatterns) {
    if (matchesPattern(baseName, pattern)) {
      return true;
    }
  }

  return false;
}

function isInIgnoredDirectory(filePath: string, customPatterns: string[] = []): boolean {
  const normalized = path.normalize(filePath);
  const parts = normalized.split(path.sep);

  for (const part of parts) {
    const lowerPart = part.toLowerCase();
    if (DEFAULT_IGNORED_DIRECTORIES.has(lowerPart)) {
      return true;
    }
    for (const pattern of customPatterns) {
      if (matchesPattern(part, pattern)) {
        return true;
      }
    }
  }

  return false;
}

async function collectFiles(
  uri: vscode.Uri,
  fileList: string[],
  userIgnoredPatterns: string[] = []
): Promise<void> {
  try {
    const stat = await fs.stat(uri.fsPath);
    if (stat.isDirectory()) {
      if (isIgnoredDirectory(uri.fsPath, userIgnoredPatterns)) {
        return;
      }
      const entries = await fs.readdir(uri.fsPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullChildPath = path.join(uri.fsPath, entry.name);
        await collectFiles(vscode.Uri.file(fullChildPath), fileList, userIgnoredPatterns);
      }
      return;
    }

    if (
      stat.isFile() &&
      !isInIgnoredDirectory(uri.fsPath, userIgnoredPatterns) &&
      !isIgnoredFile(uri.fsPath, userIgnoredPatterns) &&
      !isBinaryFile(uri.fsPath)
    ) {
      fileList.push(uri.fsPath);
    }
  } catch (err) {
    console.error(`Error reading ${uri.fsPath}:`, err);
  }
}

function sortTreeKeys(node: TreeNode): string[] {
  return Array.from(node.children.keys()).sort((a, b) => {
    const aIsDir = node.children.get(a)?.isDirectory ?? false;
    const bIsDir = node.children.get(b)?.isDirectory ?? false;
    if (aIsDir !== bIsDir) {
      return aIsDir ? -1 : 1;
    }
    return a.localeCompare(b);
  });
}

function renderTreeLines(node: TreeNode, prefix = ''): string[] {
  const lines: string[] = [];
  const keys = sortTreeKeys(node);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const child = node.children.get(key);
    if (!child) {
      continue;
    }

    const isLast = i === keys.length - 1;
    const connector = isLast ? TREE_SYMBOLS.LAST : TREE_SYMBOLS.BRANCH;
    const displayName = child.isDirectory ? `${key}/` : key;

    lines.push(`${prefix}${connector}${displayName}`);

    if (child.isDirectory && child.children.size > 0) {
      const nextPrefix = prefix + (isLast ? TREE_SYMBOLS.INDENT : TREE_SYMBOLS.VERTICAL);
      lines.push(...renderTreeLines(child, nextPrefix));
    }
  }

  return lines;
}

function generateAsciiTree(relativePaths: string[]): string {
  const root = createTreeNode(true);

  for (const relPath of relativePaths) {
    const parts = relPath.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLastPart = i === parts.length - 1;
      let child = current.children.get(part);

      if (!child) {
        child = createTreeNode(!isLastPart);
        current.children.set(part, child);
      }
      current = child;
    }
  }

  const treeLines = renderTreeLines(root);
  return '```text\n' + treeLines.join('\n') + '\n```\n\n';
}

function addLineNumbers(content: string): string {
  const lines = content.split('\n');
  const padLength = String(lines.length).length;
  return lines
    .map((line, index) => `${String(index + 1).padStart(padLength, ' ')} | ${line}`)
    .join('\n');
}

function resolveInitialUris(
  clickedUri?: vscode.Uri,
  selectedUris?: vscode.Uri[]
): vscode.Uri[] {
  if (selectedUris && selectedUris.length > 0) {
    return selectedUris;
  }
  if (clickedUri) {
    return [clickedUri];
  }
  if (vscode.window.activeTextEditor) {
    return [vscode.window.activeTextEditor.document.uri];
  }
  return [];
}

async function processDirectoryEntry(
  entry: import('fs').Dirent,
  fullPath: string,
  parentNode: TreeNode,
  customPatterns: string[]
): Promise<void> {
  if (entry.isDirectory()) {
    if (isIgnoredDirectory(fullPath, customPatterns)) {
      return;
    }
    const childNode = createTreeNode(true);
    parentNode.children.set(entry.name, childNode);
    await populateDirectoryNode(fullPath, childNode, customPatterns);
    return;
  }

  if (entry.isFile()) {
    if (isIgnoredFile(fullPath, customPatterns)) {
      return;
    }
    parentNode.children.set(entry.name, createTreeNode(false));
  }
}

async function populateDirectoryNode(
  dirPath: string,
  node: TreeNode,
  customPatterns: string[]
): Promise<void> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      await processDirectoryEntry(entry, fullPath, node, customPatterns);
    }
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err);
  }
}

async function addPathToRootNode(
  uri: vscode.Uri,
  rootNode: TreeNode,
  customPatterns: string[]
): Promise<void> {
  try {
    const stat = await fs.stat(uri.fsPath);
    const baseName = path.basename(uri.fsPath);

    if (stat.isDirectory()) {
      if (isIgnoredDirectory(uri.fsPath, customPatterns)) {
        return;
      }
      const dirNode = createTreeNode(true);
      rootNode.children.set(baseName, dirNode);
      await populateDirectoryNode(uri.fsPath, dirNode, customPatterns);
      return;
    }

    if (stat.isFile() && !isIgnoredFile(uri.fsPath, customPatterns)) {
      rootNode.children.set(baseName, createTreeNode(false));
    }
  } catch (err) {
    console.error(`Error processing path ${uri.fsPath}:`, err);
  }
}

function formatTreeOutput(lines: string[], format: string): string {
  const text = lines.join('\n');
  if (format === 'plainText') {
    return text;
  }
  return `\`\`\`text\n${text}\n\`\`\``;
}

async function readFormattedFileBlock(
  filePath: string,
  workspaceRoot: string,
  includeHeader: boolean,
  includeLines: boolean
): Promise<{ relativePath: string; block: string }> {
  const rawContent = await fs.readFile(filePath, 'utf8');
  const relativePath = path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
  const lang = getLanguage(filePath);
  const formattedContent = includeLines ? addLineNumbers(rawContent) : rawContent;

  let block = '';
  if (includeHeader) {
    block += `### \`${relativePath}\`\n\n`;
  }
  block += `\`\`\`${lang}\n${formattedContent.replace(/\r\n/g, '\n')}\n\`\`\``;

  return { relativePath, block };
}

async function copyFilesHandler(clickedUri?: vscode.Uri, selectedUris?: vscode.Uri[]): Promise<void> {
  const initialUris = resolveInitialUris(clickedUri, selectedUris);
  if (initialUris.length === 0) {
    vscode.window.showWarningMessage('No files selected.');
    return;
  }

  const config = vscode.workspace.getConfiguration('copyAsMarkdown');
  const userIgnoredFiles = config.get<string[]>('ignoredFiles', []);
  const allFiles: string[] = [];

  for (const uri of initialUris) {
    await collectFiles(uri, allFiles, userIgnoredFiles);
  }

  const uniqueFiles = Array.from(new Set(allFiles));
  if (uniqueFiles.length === 0) {
    vscode.window.showWarningMessage('No valid text files found to copy.');
    return;
  }

  const firstUri = vscode.Uri.file(uniqueFiles[0]);
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(firstUri);
  const workspaceRoot = workspaceFolder?.uri.fsPath || path.dirname(uniqueFiles[0]);

  const includeHeader = config.get<boolean>('includeFileNameAsHeader', true);
  const includeTree = config.get<boolean>('includeFileTree', false);
  const includeLines = config.get<boolean>('includeLineNumbers', false);
  const maxFileSizeKB = config.get<number>('maxFileSizeKB', 1024);
  const maxFileSizeBytes = maxFileSizeKB * 1024;

  const relativePaths: string[] = [];
  const fileBlocks: string[] = [];
  let skippedCount = 0;

  for (const filePath of uniqueFiles) {
    try {
      const stat = await fs.stat(filePath);
      if (stat.size > maxFileSizeBytes) {
        skippedCount++;
        continue;
      }
      const { relativePath, block } = await readFormattedFileBlock(filePath, workspaceRoot, includeHeader, includeLines);
      relativePaths.push(relativePath);
      fileBlocks.push(block);
    } catch (err) {
      console.error(`Failed to read file ${filePath}:`, err);
    }
  }

  if (fileBlocks.length === 0) {
    vscode.window.showErrorMessage('Failed to read selected files.');
    return;
  }

  let markdownOutput = '';
  if (includeTree && relativePaths.length > 1) {
    markdownOutput += '### Project Structure\n\n';
    markdownOutput += generateAsciiTree(relativePaths);
  }
  markdownOutput += fileBlocks.join('\n\n');

  await vscode.env.clipboard.writeText(markdownOutput.trim());

  const countMsg = `${fileBlocks.length} file${fileBlocks.length > 1 ? 's' : ''}`;
  const skipMsg = skippedCount > 0 ? ` (${skippedCount} file(s) skipped due to size)` : '';
  vscode.window.showInformationMessage(`Copied ${countMsg} as Markdown to clipboard!${skipMsg}`);
}

async function copyTreeHandler(clickedUri?: vscode.Uri, selectedUris?: vscode.Uri[]): Promise<void> {
  const initialUris = resolveInitialUris(clickedUri, selectedUris);
  if (initialUris.length === 0) {
    vscode.window.showWarningMessage('No files or folders selected.');
    return;
  }

  const config = vscode.workspace.getConfiguration('copyAsMarkdown');
  const userIgnoredFiles = config.get<string[]>('ignoredFiles', []);
  const treeFormat = config.get<string>('treeFormat', 'markdownBlock');

  const lines: string[] = [];

  try {
    if (initialUris.length === 1) {
      const targetUri = initialUris[0];
      const stat = await fs.stat(targetUri.fsPath);

      if (stat.isDirectory()) {
        const dirNode = createTreeNode(true);
        await populateDirectoryNode(targetUri.fsPath, dirNode, userIgnoredFiles);
        const baseName = path.basename(targetUri.fsPath);
        lines.push(`${baseName}/`, ...renderTreeLines(dirNode));
      } else {
        lines.push(path.basename(targetUri.fsPath));
      }
    } else {
      const rootNode = createTreeNode(true);
      for (const uri of initialUris) {
        await addPathToRootNode(uri, rootNode, userIgnoredFiles);
      }
      lines.push(...renderTreeLines(rootNode));
    }
  } catch (err) {
    console.error('Failed to generate tree structure:', err);
    vscode.window.showErrorMessage('Failed to generate tree structure.');
    return;
  }

  if (lines.length === 0) {
    vscode.window.showWarningMessage('No valid files or folders found to display in tree.');
    return;
  }

  const output = formatTreeOutput(lines, treeFormat);
  await vscode.env.clipboard.writeText(output.trim());

  vscode.window.showInformationMessage('Copied file structure tree to clipboard!');
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('copy-as-markdown.copyFiles', copyFilesHandler),
    vscode.commands.registerCommand('copy-as-markdown.copyTree', copyTreeHandler)
  );
}

export function deactivate() {}
