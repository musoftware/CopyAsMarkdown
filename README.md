# Copy as Markdown 📝

[![VS Code Extension](https://img.shields.io/badge/VS_Code_Extension-v0.1.2-007ACC?style=flat-square&logo=visual-studio-code&logoColor=white)](https://github.com/musoftware/CopyAsMarkdown)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-success?style=flat-square)]()

A lightweight and fast VS Code / Antigravity IDE extension that turns any selection of files or folders into cleanly formatted Markdown code blocks with relative paths in **one click**.

Designed especially for sharing code context with **AI & LLMs** (ChatGPT, Claude, Gemini, DeepSeek, Copilot), creating documentation, or writing PR descriptions.

---

## ⚡ Key Features

- 📁 **Multi-File & Folder Selection**: Select multiple files or entire directories from Explorer (`Ctrl` / `Cmd` + Click or `Shift` + Click), right-click and copy instantly.
- 🌳 **Recursive Folder Parsing**: Select a directory to recursively copy all text and code files inside with their proper relative workspace paths.
- 🛡️ **Smart Ignore & Safety**:
  - Automatically skips bulky build folders (`node_modules`, `.git`, `dist`, `out`, `build`, `.next`, `.nuxt`, `vendor`, etc.).
  - Filters out binary files (images, audio, video, PDFs, archives, executables).
  - Skips oversized files based on configurable size limits (default: 1 MB).
- 🎨 **Automatic Language Detection**: Accurately maps 35+ file extensions (JS, TS, Python, Rust, Go, PHP/Blade, C++, SQL, Vue, Svelte, and more) to markdown syntax highlighting identifiers.
- 🌲 **Optional ASCII Directory Tree**: Generates a clean directory overview tree at the top of your copied markdown output.
- 🔢 **Optional Line Numbers**: Automatically adds padded line numbers to code blocks for code review or line-specific LLM discussions.
- 📍 **Everywhere in the UI**: Access via Explorer context menu, Editor tab title bar, Editor context menu, or Command Palette.

---

## 📋 Markdown Output Preview

When you copy multiple files, your clipboard is formatted ready for immediate pasting:

````markdown
### `src/utils/math.ts`

```typescript
export function add(a: number, b: number): number {
  return a + b;
}
```

### `src/index.ts`

```typescript
import { add } from './utils/math';

console.log(add(5, 10));
```
````

*(Optional with `copyAsMarkdown.includeFileTree`: `true`)*

````markdown
### Project Structure

```text
src/
├── utils/
│   └── math.ts
└── index.ts
```

### `src/utils/math.ts`
...
````

---

## 🚀 How to Use

### Method 1: File Explorer (Multiple Files & Folders)
1. In the VS Code Explorer sidebar, select one or multiple files/folders (`Ctrl` / `Cmd` + Click).
2. Right-click and choose **Copy as Markdown**.
3. Paste (`Ctrl+V` / `Cmd+V`) into your AI chat, GitHub issue, or documentation editor.

### Method 2: Active Editor Tab
- Click the **Copy as Markdown** icon ($(markdown)) in the top-right corner of the editor title bar.
- Or right-click anywhere inside the open editor and select **Copy as Markdown**.

### Method 3: Command Palette
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS).
2. Type `Copy as Markdown` and press `Enter`.

---

## ⚙️ Extension Settings

Customize the formatting behavior in your VS Code settings (`Ctrl+,` / `Cmd+,` → search for `Copy as Markdown`):

| Setting | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `copyAsMarkdown.includeFileNameAsHeader` | `boolean` | `true` | Include the relative file path as an `### `path/to/file.ext`` header. |
| `copyAsMarkdown.includeFileTree` | `boolean` | `false` | Include an ASCII directory tree of copied files at the top of the output. |
| `copyAsMarkdown.includeLineNumbers` | `boolean` | `false` | Add padded line numbers (`1 | code...`) to each code block. |
| `copyAsMarkdown.maxFileSizeKB` | `number` | `1024` | Maximum file size in KB to read (skips files larger than this limit). |

---

## 🔍 Supported Languages

The extension automatically applies correct code block syntax tags for:

- **Web / Frontend**: TypeScript (`.ts`, `.tsx`), JavaScript (`.js`, `.jsx`, `.mjs`, `.cjs`), HTML, CSS, SCSS, SASS, LESS, Vue, Svelte
- **Backend / Systems**: Python (`.py`), Go (`.go`), Rust (`.rs`), Java (`.java`), C# (`.cs`), C / C++ (`.c`, `.cpp`, `.h`, `.hpp`), PHP & Laravel Blade (`.php`, `.blade.php`), Ruby (`.rb`), Kotlin (`.kt`), Swift (`.swift`), Dart (`.dart`)
- **Data & Config**: JSON, JSONC, YAML, TOML, XML, SQL, INI, `.env`, GraphQL, Protocol Buffers (`.proto`)
- **Shell & DevOps**: Bash / Shell (`.sh`, `.zsh`), PowerShell (`.ps1`), Dockerfile

---

## 🛠️ Development & Building

### Running from Source
1. Clone the repository:
   ```bash
   git clone https://github.com/musoftware/CopyAsMarkdown.git
   cd CopyAsMarkdown
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Open in VS Code and press `F5` to start the **Extension Development Host**.

### Package to `.vsix`
```bash
npx @vscode/vsce package
```

### Install `.vsix` Locally
```bash
# In VS Code:
code --install-extension copy-as-markdown-0.1.2.vsix

# In Antigravity IDE:
antigravity-ide --install-extension copy-as-markdown-0.1.2.vsix
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
