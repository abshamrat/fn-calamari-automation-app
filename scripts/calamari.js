'use strict'
const request = require('request');
const {Notification} = require('electron')
const path = require('path');
const baseUrl = 'https://fieldnation.calamari.io/api/clockin/';
const auth = {
  'user': 'api',
  'pass': 'youpass'
};
const urls = {
  'currentStatus' : baseUrl+'shift/status/v1/get-current',
  'clockIn' : baseUrl+'terminal/v1/clock-in',
  'clockOut' : baseUrl+'terminal/v1/clock-out'
};
const FNTray = require(path.join(__dirname,'/fnTray.js'));

class Calamari {
  constructor(email, window){
    this.isReady = false;
    this.isPressedQuit = false;
    this.useremail = email;
    this.fnTray = new FNTray(window);
    this.initVars();
    this.fnTray.init(this);   
  }
  initVars() {
    this.headers = {
      'content-type': 'application/json'
    };
    this.dataObject = {
      'currentStatus': {
        person: this.useremail
      },
      'clockInOut': {
        time:new Date(),
        person: this.useremail
      }
    };
  }
  getDataObject(type) {
    if(type == 'clockIn' || type == 'clockOut')
    {
      const d = new Date();
      this.dataObject['clockInOut'].time = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+'T'+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds();
      return this.dataObject['clockInOut'];
    }
    return this.dataObject[type];
  }
  setOptions(type) {
    this.options = {
      url: urls[type],
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(this.getDataObject(type)),
      auth: auth
    };
  }
  setEmail(email){
    if(this.prevemail == email)
      return;
    this.useremail = email;
    this.initVars();
    this.setReady(true);
  }
  
  makeRequest(type){
    if(this.isReady)
    {
      this.setOptions(type);
      this.prevemail = this.useremail;
      this.fnTray.tray.setImage(this.fnTray.calamariWhite);
      request(this.options, (error, response, body) => {
        
        if (!error && response.statusCode == 200) {
          this.decide(JSON.parse(body), type);        
          return;
        }else if(!error && response.statusCode == 400){
          this.visibleClockIn();
          this.fnTray.tray.setImage(this.fnTray.calamariRed);
          this.showNotification("error");
        }else{
          this.visibleClockIn();
          this.fnTray.tray.setImage(this.fnTray.calamariRed);
          this.showNotification("internetError");
        }
      })
    }
  }
  decide(responseObj, type) {
    if(type === 'clockIn')
    {
      this.visibleClockOut();
      this.fnTray.tray.setImage(this.fnTray.calamariDefault);
    }
    else{
      this.visibleClockIn();
      this.fnTray.tray.setImage(this.fnTray.calamariRed);
    }
    this.showNotification(type);
    return true;
  }
  visibleClockIn() {
    this.fnTray.contextMenu.items[0].visible = true;
    this.fnTray.contextMenu.items[1].visible = false;
    this.fnTray.notifyMenuChange();
  }
  visibleClockOut() {
    this.fnTray.contextMenu.items[0].visible = false;
    this.fnTray.contextMenu.items[1].visible = true;
    this.fnTray.notifyMenuChange();
  }
  showOnly() {
    this.fnTray.contextMenu.items[0].visible = false;
    this.fnTray.contextMenu.items[1].visible = false;
    this.fnTray.notifyMenuChange();
  }
  setReady(bool){
    this.isReady = bool;
    this.makeRequest("clockIn");
  }
  showNotification(messageType){
    let message = {title:"",body:""};
    if(messageType === 'error')
    {
      message.title = "ERROR!";
      message.body = "Employee email is not valid. Please check your email from settings.";
    }
    else if(messageType === 'internetError')
    {
      message.title = "No internet";
      message.body = "Checking the network cables, modem, and router. Please try again";
    }
    else
    {
      message.title = messageType.toUpperCase();
      message.body = "You are successfully "+messageType.replace("clock","Clocked ");
    }
    const notification = new Notification(message);
    notification.show();
  }
  shuttingDown() {
    console.log("shuttingDown");
    this.makeRequest('clockOut');
    console.log("clockOut");
  }
}

module.exports = Calamari;
