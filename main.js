// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, dialog, shell, webContents } = require('electron');
const fs = require('fs'), /*path = require('path'), */
    config = require('./config.js'), child_process = require('child_process');

// 配置文件地址
const CONFIG_FILE = './config.conf';

// 获取配置的首页
let configInFile = {};

/**
 * 读取文件配置
 */
function readConfigFile() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      configInFile = JSON.parse(fs.readFileSync(CONFIG_FILE).toString('utf-8'));
    } catch (e) {
      console.warn('读取配置出错', e);
    }
  }
}
readConfigFile();

// region 自定义菜单
const template = [
  {
    label: '操作',
    submenu: [
      { label: '刷新', role: 'reload' },
      { label: '强制刷新', role: 'forcereload' },
      { type: 'separator' },
      { label: '重置缩放', role: 'resetzoom' },
      { label: '放大', role: 'zoomin' },
      { label: '缩小', role: 'zoomout' },
      { type: 'separator' },
      { label: '全屏', role: 'togglefullscreen' },
    ]
  },
  {
    label: '工具',
    submenu: [
      { label: '调试工具', role: 'toggledevtools' },
      { type: 'separator' },
      {
        label: '打开当前日志文件',
        click () {
          shell.openItem(config.logger.file);
        },
      },
      {
        label: '打开当前日志文件夹',
        click () {
          shell.showItemInFolder(config.logger.file);
        },
      },
      {
        label: '清空日志文件夹',
        click () {
          try {
            if (config.logger.cleanup()) {
              dialog.showMessageBox(mainWindow, {type: 'info', title: '消息', message: '清空成功!'});
            }
          } catch (e) {
            dialog.showErrorBox('清空错误', e.message);
          }
        },
      },
      { type: 'separator' },
      {
        label: '使用系统默认浏览器打开当前页面',
        click () {
          shell.openExternal(webContents.getFocusedWebContents().getURL());
        },
      },
    ]
  },
  {
    label: '帮助',
    submenu: [
      {label: '设置', click () {mainWindow.loadFile('index.html');}},
      {
        label: '使用系统默认浏览器打开设置的链接',
        click () {
          if (configInFile['homepage']) {
            mainWindow.loadURL(configInFile['homepage']);
          } else {
            mainWindow.loadFile('index.html');
          }
        },
      },
    ]
  }
];
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
// endregion

// region 加载flash
// 谷歌flash插件地址~\AppData\Local\Google\Chrome\User Data\PepperFlash\
/*let pluginName;
switch (process.platform) {
  case 'win32':
    pluginName = 'pepflashplayer.dll';
    break;
  case 'darwin':
    pluginName = 'PepperFlashPlayer.plugin';
    break;
  case 'linux':
    pluginName = 'libpepflashplayer.so';
    break;
}
app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, pluginName));
app.commandLine.appendSwitch('ppapi-flash-version', '17.0.0.169');*/
// endregion

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000, height: 720,
    webPreferences: {
      // plugins: true,
      nodeIntegration: true
    }
  });
  mainWindow.setTitle('日志收集器');

  // 设置主页面的全局ID
  global.mainWindow = {id: mainWindow.id};

  // and load the index.html of the app.
  // mainWindow.loadFile('index.html');
  if (configInFile['homepage']) {
    mainWindow.loadURL(configInFile['homepage']);
  } else {
    mainWindow.loadFile('index.html');
  }
  mainWindow.webContents.on('dom-ready', () => {
    const ignore = mainWindow.webContents.executeJavaScript(
      fs.readFileSync('./logger-injector.js').toString('utf-8')
    );
  });
  // mainWindow.maximize();

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // 当页面中调用了beforeunload等离开限制事件时
  mainWindow.webContents.on('will-prevent-unload', (event) => {
    const choice = dialog.showMessageBox(mainWindow, {
      type: 'question',
      title: '确定离开?',
      message: '确定离开该页面?',
      buttons: ['取消', '确定'],
      defaultId: 0,
      cancelId: 1
    });
    const leave = (choice === 1);
    if (leave) {
      event.preventDefault();
    }
  });
  // 当页面请求打开新页面时
  mainWindow.webContents.on('new-window', (event, url) => {
    if (url) {
      // 当为RTMP开头时, 使用系统级播放器打开
      if (url.toLowerCase().startsWith('rtmp://')) {
        // 读取最新的配置
        readConfigFile();
        if (configInFile['RTMPPlayer']) {
          try {
            child_process.exec('"' + configInFile['RTMPPlayer'] + '" "' + url + '"', error => {
              if (error) {
                dialog.showMessageBox(mainWindow, {
                  type: 'error',
                  title: '错误',
                  message: '打开直播播放器失败: ' + error,
                });
              }
            });
          } catch (e) {
            dialog.showMessageBox(mainWindow, {
              type: 'error',
              title: '错误',
              message: '打开直播播放器失败: ' + e.message,
            });
          }
        } else {
          dialog.showMessageBox(mainWindow, {
            type: 'warning',
            title: '配置文件错误',
            message: '未配置直播播放器!',
          });
        }
        event.preventDefault();
      }
    }
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
