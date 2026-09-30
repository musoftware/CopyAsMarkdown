import { execFile } from 'child_process';
import * as os from 'os';

function executeCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(command, args, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function copyFileWindows(filePath: string): Promise<void> {
  const escaped = filePath.replace(/'/g, "''");
  const script = `Set-Clipboard -LiteralPath '${escaped}'`;
  await executeCommand('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script]);
}

async function copyFileDarwin(filePath: string): Promise<void> {
  const escaped = filePath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const script = `set the clipboard to (POSIX file "${escaped}")`;
  await executeCommand('osascript', ['-e', script]);
}

async function copyFileLinux(filePath: string): Promise<void> {
  const fileUri = `file://${encodeURI(filePath)}`;
  try {
    await executeCommand('xclip', ['-selection', 'clipboard', '-t', 'text/uri-list'], );
  } catch {
    await executeCommand('wl-copy', ['-t', 'text/uri-list', fileUri]);
  }
}

export async function copyFileToClipboard(filePath: string): Promise<void> {
  const platform = os.platform();

  if (platform === 'win32') {
    await copyFileWindows(filePath);
    return;
  }

  if (platform === 'darwin') {
    await copyFileDarwin(filePath);
    return;
  }

  if (platform === 'linux') {
    await copyFileLinux(filePath);
    return;
  }

  throw new Error(`Unsupported platform for clipboard file drop: ${platform}`);
}
