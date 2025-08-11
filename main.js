import { app, BrowserWindow, Menu, nativeImage, shell } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 单例锁，避免多开
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

let mainWindow = null

function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png')
  const icon = nativeImage.createFromPath(iconPath)

  mainWindow = new BrowserWindow({
    width: 500,
    height: 500,
    minWidth: 320,
    minHeight: 500,
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    title: '牛马时钟',
    icon,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))

  if (process.env.ELECTRON_START_URL) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 自定义简易菜单，提供刷新/打开开发者工具
function buildMenu() {
  const template = [
    {
      label: '应用',
      submenu: [
        { role: 'reload', label: '刷新' },
        { role: 'toggleDevTools', label: '切换开发者工具' },
        { type: 'separator' },
        { role: 'quit', label: '退出' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: 'Electron 官网',
          click: () => shell.openExternal('https://www.electronjs.org')
        }
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  buildMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
