'use strict'
const path = require('path')
const electron = require('electron')

const app = electron.app
const Tray = electron.Tray
const Menu = electron.Menu

let menuTray = null;

// const trayIconWindows = path.join(__dirname, '../static/icon.ico');

class FNTray {
  constructor(win) {
    this.win = win;
    this.tray = null;
    this.calamari = null;

    this.calamariDefault = path.join(__dirname, '../static/calamari_icon.png');
    this.calamariRed = path.join(__dirname, '../static/calamari_red_icon.png');
    this.calamariWhite = path.join(__dirname, '../static/calamari_white_icon.png');
    menuTray = this;
  }
  init(calamari) {
    this.calamari = calamari;

    this.tray = new Tray(this.calamariRed)
    this.contextMenu = Menu.buildFromTemplate([{
      label: 'ClockIn',
      click() {
        menuTray.calamari.makeRequest('clockIn');
      }
    }, {
      label: 'ClockOut',
      click() {
        menuTray.calamari.makeRequest('clockOut');
      }
    }, {
      type: 'separator'
    }, {
      label: 'Settings',
      click() {
        menuTray.win.show();
      }
    }
    , {
      label: 'Quit',
      click() {
        app.quit();
        
      }
    }
  ]);
  
  this.tray.setToolTip(`${app.getName()}`);
  this.tray.setContextMenu(this.contextMenu);
  this.tray.on('click', function handleClicked() {
      console.log(handleClicked);
    });
  }
  setMenuChecked(index, bool){
    this.contextMenu.items[index].checked = bool; 
    this.notifyMenuChange();
  }
  notifyMenuChange() {
    this.tray.setContextMenu(this.contextMenu);
  }
  
}

module.exports = FNTray;