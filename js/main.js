// UI elements.
const deviceNameLabel = document.getElementById('device-name');
const connectButton = document.getElementById('connect');
const disconnectButton = document.getElementById('disconnect');
const ledonButton = document.getElementById('ledon');
const ledoffButton = document.getElementById('ledoff');
const batteryButton = document.getElementById('battery');
const terminalContainer = document.getElementById('terminal');
const sendForm = document.getElementById('send-form');
const inputField = document.getElementById('input');

let flag = 'None';
let voltage = 'None';
let voltageNum = 0;
let DeviceName = 0;

// Helpers.
const defaultDeviceName = 'LIGHT';
const terminalAutoScrollingLimit = terminalContainer.offsetHeight / 2;
let isTerminalAutoScrolling = true;

const scrollElement = (element) => {
  const scrollTop = element.scrollHeight - element.offsetHeight;

  if (scrollTop > 0) {
    element.scrollTop = scrollTop;
  }
};

const logToTerminal = (message, type = '') => {
  terminalContainer.insertAdjacentHTML('beforeend',
      `<div${type && ` class="${type}"`}>${message}</div>`);

  if (isTerminalAutoScrolling) {
    scrollElement(terminalContainer);
  }
};

// Obtain configured instance.
const terminal = new BluetoothTerminal();

// Override `receive` method to log incoming data to the terminal.
terminal.receive = function(data) {
  // if (data.includes('OK+Set:')) {
  //   logToTerminal('Setted parameter ' + data, 'in');}
  if (flag == 'LightsOn') {
    switch(data) {
      case 'OK+RESET': {  // if (x === 'value2')
        DeviceName = terminal.getDeviceName() ? terminal.getDeviceName() : defaultDeviceName;
        if (DeviceName == 'FOUNTAIN')
          logToTerminal('Фонтан включен, устройство перезагружается', 'sys');
        else
          logToTerminal('Гирлянда включена, устройство перезагружается', 'sys');
        flag = 'None';
      }
      break;
      default:
        // logToTerminal('default' + data, 'sys');
    }
  }
  else if (flag == 'LightsOff') {
    switch(data) {
      case 'OK+RESET': { // if (x === 'value2')
        DeviceName = terminal.getDeviceName() ? terminal.getDeviceName() : defaultDeviceName;
        if (DeviceName == 'FOUNTAIN')
          logToTerminal('Фонтан отключен, устройство перезагружается', 'sys');
        else
          logToTerminal('Гирлянда отключена, устройство перезагружается', 'sys');
        flag = 'None';
      }
      break;
      default:
        // logToTerminal('default' + data, 'sys');
    }
  }
  else if (flag == 'battery_voltage') {
    voltage = data.substr(data.length - 3, data.length);
    voltageNum = Number(voltage);
    if (voltageNum < 50)
      logToTerminal('Заряд батареи менее 5%, зарядите устройство! ', 'out');
    else if (voltageNum < 99)
      logToTerminal('Заряд батареи менее 30% ', 'sys');
    else
      logToTerminal('Заряд батареи более 30% ', 'sys');
    flag = 'None';
  }
  else if (flag == 'light_stat') {
    if (data.substr(data.length - 1, data.length) == '1')
      logToTerminal('Гирлянда включена.', 'sys');
    else if (data.substr(data.length - 1, data.length) == '0')
      logToTerminal('Гирлянда выключена.', 'sys');
    else
      ;
    flag = 'None';
  }
  else {
    logToTerminal('Received data ' + data, 'in');}
};

// Override default log method to output messages to the terminal and console.
terminal._log = function(...messages) {
  // We can't use `super._log()` here.
  messages.forEach((message) => {
    logToTerminal(message);
    console.log(message); // eslint-disable-line no-console
  });
};

// Implement own send function to log outcoming data to the terminal.
const send = (data) => {
    // flag = 'None';
    terminal.send(data).
    then(() => logToTerminal(data, 'out')).
    catch((error) => logToTerminal(error));
};

// Implement own send function to log outcoming data to the terminal.
const sendcmd = (data) => {
    terminal.send(data).
    // then(() => logToTerminal('Leds OFF', 'out')).
    catch((error) => logToTerminal(error));
};

// Disconnection by timer.
setInterval(() => {
  // logToTerminal('timerdisconnect', 'out');
  terminal.timerdisconnect();
}, 300000);

// Bind event listeners to the UI elements.
connectButton.addEventListener('click', () => {
  terminal.connect().
      then(() => {
        deviceNameLabel.textContent = terminal.getDeviceName() ?
            terminal.getDeviceName() : defaultDeviceName;
      });
});

disconnectButton.addEventListener('click', () => {
  terminal.disconnect();
  deviceNameLabel.textContent = defaultDeviceName;
});

ledonButton.addEventListener(
  'click', () => {
    flag = 'LightsOn';
    sendcmd('AT+BEFC200');
    setTimeout(() => {  sendcmd('AT+AFTC200'); }, 200);
    // setTimeout(() => {  send('AT+PIO21'); }, 1000);
    setTimeout(() => {  sendcmd('AT+RESET'); }, 400);
  }
);

ledoffButton.addEventListener(
  'click', () => {
    flag = 'LightsOff';
    sendcmd('AT+BEFC000');
    setTimeout(() => {  sendcmd('AT+AFTC000'); }, 200);
    // setTimeout(() => {  send('AT+PIO20'); }, 1000);
    setTimeout(() => {  sendcmd('AT+RESET'); }, 400);
  }
);

batteryButton.addEventListener(
  'click', () => {
    // sendcmd('AT+BATT?');
    flag = 'battery_voltage';
    sendcmd('AT+BATT?');
  }
);

sendForm.addEventListener('submit', (event) => {
  event.preventDefault();
  // flag = 'None';
  send(inputField.value);

  // inputField.value = '';
  inputField.focus();
});

// Switch terminal auto scrolling if it scrolls out of bottom.
terminalContainer.addEventListener('scroll', () => {
  const scrollTopOffset = terminalContainer.scrollHeight -
      terminalContainer.offsetHeight - terminalAutoScrollingLimit;

  isTerminalAutoScrolling = (scrollTopOffset < terminalContainer.scrollTop);
});
