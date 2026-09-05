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
  'ehthumbs_vista.db'
]);

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svgz',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.tar', '.gz', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp3', '.mp4', '.mkv', '.avi', '.mov', '.wav', '.flac',
  '.pyc', '.pyo', '.class', '.o', '.obj', '.lock',
  '.db', '.sqlite', '.sqlite3'
]);

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.ts': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.tsx': 'tsx',
  '.jsx': 'jsx',
  '.py': 'python',
  '.pyw': 'python',
  '.java': 'java',
  '.cs': 'csharp',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.h': 'c',
  '.c': 'c',
  '.go': 'go',
  '.rs': 'rust',
  '.php': 'php',
  '.phtml': 'php',
  '.blade.php': 'blade',
  '.json': 'json',
  '.jsonc': 'jsonc',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.ps1': 'powershell',
  '.sql': 'sql',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.dart': 'dart',
  '.swift': 'swift',
  '.rb': 'ruby',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.xml': 'xml',
  '.svg': 'xml',
  '.toml': 'toml',
  '.ini': 'ini',
  '.env': 'dotenv',
  '.dockerfile': 'dockerfile',
  'dockerfile': 'dockerfile',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.lua': 'lua',
  '.r': 'r',
  '.proto': 'protobuf'
};

function getLanguage(filePath: string): string {
  const baseName = path.basename(filePath).toLowerCase();
  if (EXTENSION_LANGUAGE_MAP[baseName]) {
    return EXTENSION_LANGUAGE_MAP[baseName];
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
  return lowerName === lowerPattern;
}

function isIgnoredFile(filePath: string, customPatterns: string[] = []): boolean {
  const baseName = path.basename(filePath);
  const lowerBaseName = baseName.toLowerCase();

  // Skip AppleDouble files (._*)
  if (baseName.startsWith('._')) {
    return true;
  }

  // Check default ignored system files
  if (DEFAULT_IGNORED_FILES.has(lowerBaseName)) {
    return true;
  }

  // Check user-configured patterns
  for (const pattern of customPatterns) {
    if (matchesPattern(baseName, pattern)) {
      return true;
    }
  }

  return false;
}

async function collectFiles(
  uri: vscode.Uri,
  fileList: string[],
  userIgnoredFiles: string[] = []
): Promise<void> {
  try {
    const stat = await fs.stat(uri.fsPath);
    if (stat.isDirectory()) {
      const baseName = path.basename(uri.fsPath).toLowerCase();
      if (DEFAULT_IGNORED_DIRECTORIES.has(baseName)) {
        return;
      }
      const entries = await fs.readdir(uri.fsPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullChildPath = path.join(uri.fsPath, entry.name);
        await collectFiles(vscode.Uri.file(fullChildPath), fileList, userIgnoredFiles);
      }
    } else if (stat.isFile()) {
      if (!isIgnoredFile(uri.fsPath, userIgnoredFiles) && !isBinaryFile(uri.fsPath)) {
        fileList.push(uri.fsPath);
      }
    }
  } catch (err) {
    console.error(`Error reading ${uri.fsPath}:`, err);
  }
}

function generateAsciiTree(relativePaths: string[]): string {
  interface TreeNode {
    [key: string]: TreeNode;
  }

  const root: TreeNode = {};

  for (const relPath of relativePaths) {
    const parts = relPath.split('/');
    let current = root;
    for (const part of parts) {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
  }

  function renderTree(node: TreeNode, prefix = ''): string[] {
    const lines: string[] = [];
    const keys = Object.keys(node).sort((a, b) => {
      const aIsDir = Object.keys(node[a]).length > 0;
      const bIsDir = Object.keys(node[b]).length > 0;
      if (aIsDir !== bIsDir) {
        return aIsDir ? -1 : 1;
      }
      return a.localeCompare(b);
    });

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const isLast = i === keys.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const isDir = Object.keys(node[key]).length > 0;

      lines.push(`${prefix}${connector}${key}${isDir ? '/' : ''}`);

      if (isDir) {
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        lines.push(...renderTree(node[key], childPrefix));
      }
    }
    return lines;
  }

  const treeLines = renderTree(root);
  return '```text\n' + treeLines.join('\n') + '\n```\n\n';
}

function addLineNumbers(content: string): string {
  const lines = content.split('\n');
  const padLength = String(lines.length).length;
  return lines
    .map((line, index) => `${String(index + 1).padStart(padLength, ' ')} | ${line}`)
    .join('\n');
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'copy-as-markdown.copyFiles',
    async (clickedUri?: vscode.Uri, selectedUris?: vscode.Uri[]) => {
      let initialUris: vscode.Uri[] = [];

      if (selectedUris && selectedUris.length > 0) {
        initialUris = selectedUris;
      } else if (clickedUri) {
        initialUris = [clickedUri];
      } else if (vscode.window.activeTextEditor) {
        initialUris = [vscode.window.activeTextEditor.document.uri];
      }

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

      // Deduplicate file paths
      const uniqueFiles = Array.from(new Set(allFiles));

      if (uniqueFiles.length === 0) {
        vscode.window.showWarningMessage('No valid text files found to copy.');
        return;
      }

      // Determine workspace root
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

          const rawContent = await fs.readFile(filePath, 'utf8');
          const relPath = path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
          const lang = getLanguage(filePath);
          const formattedContent = includeLines ? addLineNumbers(rawContent) : rawContent;

          relativePaths.push(relPath);

          let block = '';
          if (includeHeader) {
            block += `### \`${relPath}\`\n\n`;
          }
          block += `\`\`\`${lang}\n${formattedContent.replace(/\r\n/g, '\n')}\n\`\`\``;
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
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
