const AutoLaunch = require('auto-launch')
const electron = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

const Calamari = require(path.join(__dirname, '/scripts/calamari.js'));

const AppLauncher = new AutoLaunch({
  name: 'fn-calamari-app'
});

let appWindow=null;
let appObject=null;

/*process.on('uncaughtException', (err) => {
  console.log('application almost crashed!', err);
});*/

const isAlreadyRunning = app.makeSingleInstance(() => {
  if (appObject.mainWindow) {
    if (appObject.mainWindow.isMinimized()) {
      appObject.mainWindow.restore()
    }
    appObject.mainWindow.webContents.on('did-finish-load', function() {
      setTimeout(function() {
        appObject.mainWindow.show()
      }, 60)
    })
  }
})

if (isAlreadyRunning) {
  app.quit()
}

class AppWindow{
  constructor(){
    appWindow = this;
    this.init();
    this.checkPreference();
  }
  checkPreference(){
    try{
      fs.readFile(path.join(__dirname, 'preference.json'), 'utf8', function (err, data) {
        if (err) throw err;
        let obj = JSON.parse(data);
        if(obj.useremail !== "")
        {
          appWindow.createCalamari(true, obj.useremail);
          return;
        }
        appWindow.createWindow(obj.useremail);
      });
    }catch(ex){}
  }
  init(){
    AppLauncher.enable();
    AppLauncher.isEnabled()
    .then(function(isEnabled){
        if(isEnabled){
            return;
        }
        AppLauncher.enable();
    })
    .catch(function(err){
        // handle error
    });
   
  }
  createCalamari(from, useremail){
    if(this.calamari === undefined)
    {
      this.calamari = new Calamari(useremail, appWindow);
      if(this.mainWindow === undefined || from)
        this.calamari.setReady(true);
      this.calamari.showOnly();
      return;
    }
    this.calamari.setEmail(useremail);
    
  }
  createWindow(useremail){
    this.mainWindow = new BrowserWindow({
      width: 420,
      height: 390,
      frame: false,
      icon: path.join(__dirname, 'static/calamari_icon.png')
    });
    this.mainWindow.setResizable(false);
    this.mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }));
    this.mainWindow.on('hide', () => {
      appWindow.checkPreference();
    });
    if(useremail !== null)
      this.createCalamari(false, useremail);
  }
  show(){
    if(this.mainWindow === undefined)
    {
      this.createWindow(null);
      return;
    }
    this.mainWindow.show();
  }
  hide(){
    this.mainWindow.hide();
  }

}
app.on('ready', function() {
  appObject = new AppWindow();
})
// Some APIs can only be used after this event occurs.
app.on('hide', function() {
  console.log("Working-hide");
})

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (appObject.mainWindow === null) {
    appObject = new AppWindow();    
  }
});
