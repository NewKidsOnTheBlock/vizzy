import { app, BrowserWindow } from 'electron';
import jetpack from 'fs-jetpack';

export var devMenuTemplate = {
    label: 'Development',
    submenu: [{
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function () {
            BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
        }
    },{
        label: 'Toggle DevTools',
        accelerator: 'Alt+CmdOrCtrl+I',
        click: function () {
            BrowserWindow.getFocusedWindow().toggleDevTools();
        }
    },{
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click: function () {
            app.quit();
        }
    },{
        label: 'Clear preferences',
        accelerator: 'CmdOrCtrl+D',
        click: function () {
            var slash = (function() {
                if(process.platform === 'darwin' || process.platform === 'linux') {
                    return '/';
                }
                else return '\\'
            })();
            var path = app.getPath('userData');
            path = path + slash + 'vizzyPrefs.json';
            jetpack.remove(path);
        }
    }]
};
