# Copy as Markdown (VS Code Extension)

A lightweight and fast VS Code extension that lets you select multiple files or folders from the Explorer or Active Editor and copy them directly to your clipboard formatted cleanly as Markdown code blocks with relative paths.

## ✨ Features

- **Multi-File Selection:** Select one or multiple files in Explorer (`Ctrl + Click` or `Shift + Click`), right-click and choose **Copy as Markdown**.
- **Folder Support:** Select folders and recursively copy all code files inside (automatically ignores `node_modules`, `.git`, binary files, etc.).
- **Editor Title & Context Menu:** Copy directly from the editor's title bar button or context menu.
- **Auto Language Detection:** Accurate Markdown syntax highlighting blocks based on file extensions.
- **ASCII File Tree (Optional):** Generates an ASCII folder/file tree overview at the top.
- **Line Numbers (Optional):** Adds formatted line numbers to each code block.
- **Safe Handling:** Automatically filters out binary files (images, pdfs, executables) and respects max file size limits.

## ⚙️ Extension Settings

This extension contributes the following settings:

| Setting | Default | Description |
| :--- | :--- | :--- |
| `copyAsMarkdown.includeFileNameAsHeader` | `true` | Include the relative file path as an `### \`path/to/file.ext\`` header |
| `copyAsMarkdown.includeFileTree` | `false` | Include an ASCII directory tree of copied files at the top |
| `copyAsMarkdown.includeLineNumbers` | `false` | Include line numbers before each line in the code blocks |
| `copyAsMarkdown.maxFileSizeKB` | `1024` | Maximum file size in KB to read (skips larger files) |

## 🚀 How to Run & Test

1. Open this folder in VS Code.
2. Press `F5` to start the **Extension Development Host**.
3. In the new window, select any files in the Explorer, right-click, and click **Copy as Markdown**.

## 📦 Package & Install Locally

To package and install as a `.vsix` file:

```bash
npm install -g @vscode/vsce
vsce package
code --install-extension copy-as-markdown-0.1.0.vsix
```
