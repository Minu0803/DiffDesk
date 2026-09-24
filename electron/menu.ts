import { app, BrowserWindow, dialog, Menu } from 'electron'
import { IPC_CHANNELS, MenuCommand } from '../shared/ipc'

function targetWindow(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
}

function send(cmd: MenuCommand): void {
  targetWindow()?.webContents.send(IPC_CHANNELS.menu, cmd)
}

function item(label: string, cmd: MenuCommand, accelerator?: string): Electron.MenuItemConstructorOptions {
  return { label, accelerator, click: () => send(cmd) }
}

function showAbout(): void {
  const options: Electron.MessageBoxOptions = {
    type: 'info',
    title: 'DiffDesk 정보',
    message: `DiffDesk ${app.getVersion()}`,
    detail: '로컬 텍스트/코드 비교·병합 도구',
    buttons: ['확인']
  }
  const win = targetWindow()
  if (win) void dialog.showMessageBox(win, options)
  else void dialog.showMessageBox(options)
}

export function buildAppMenu(): Menu {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '파일',
      submenu: [
        item('왼쪽 파일 열기', 'open-left', 'CmdOrCtrl+O'),
        item('오른쪽 파일 열기', 'open-right', 'CmdOrCtrl+Shift+O'),
        { type: 'separator' },
        item('저장', 'save-focused', 'CmdOrCtrl+S'),
        item('왼쪽 다른 이름으로 저장', 'save-as-left'),
        item('오른쪽 다른 이름으로 저장', 'save-as-right'),
        { type: 'separator' },
        { label: '종료', role: 'quit' }
      ]
    },
    {
      label: '비교',
      submenu: [
        item('다음 차이', 'next-diff', 'F7'),
        item('이전 차이', 'prev-diff', 'Shift+F7'),
        { type: 'separator' },
        item('모두 오른쪽으로 복사', 'copy-all-ltr', 'Ctrl+Alt+Right'),
        item('모두 왼쪽으로 복사', 'copy-all-rtl', 'Ctrl+Alt+Left'),
        { type: 'separator' },
        item('좌우 바꾸기', 'swap', 'Ctrl+Alt+X'),
        item('모두 지우기', 'clear-all')
      ]
    },
    {
      label: '보기',
      submenu: [
        item('나란히·한줄 전환', 'toggle-view', 'CmdOrCtrl+\\'),
        item('공백 무시', 'toggle-whitespace'),
        item('자동 줄바꿈', 'toggle-wrap', 'Alt+Z'),
        { type: 'separator' },
        item('테마 전환', 'cycle-theme'),
        { type: 'separator' },
        {
          label: '개발자 도구',
          accelerator: 'F12',
          click: () => targetWindow()?.webContents.toggleDevTools()
        }
      ]
    },
    {
      label: '도움말',
      submenu: [{ label: 'DiffDesk 정보', click: showAbout }]
    }
  ]
  return Menu.buildFromTemplate(template)
}
