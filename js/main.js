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

// Helpers.
const defaultDeviceName = 'Lights';
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
  if (flag == 'set_parameter') {
    if (data == 'OK+Set:200')
      logToTerminal('Гирлянда включена ' + data, 'sys');
    else if (data == 'OK+Set:000')
      logToTerminal('Гирлянда выключена ' + data, 'sys');
    else if (data == 'OK+RESET')
      logToTerminal('Устройство перезагружается ' + data, 'sys');}
  else if (flag == 'battery_voltage') {
    logToTerminal('Напряжение батареи ' + data, 'sys');}
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
    flag = 'None';
    terminal.send(data).
    then(() => logToTerminal(data, 'out')).
    catch((error) => logToTerminal(error));
};

// Implement own send function to log outcoming data to the terminal.
const sendcmd = (data) => {
  if (data == 'AT+BATT?') {
    terminal.send(data).
    // then(() => logToTerminal('Напряжение батареи', 'out')).
    catch((error) => logToTerminal(error));}
  else if (data == 'AT+RESET') {
    // flag = 'set_parameter';
    terminal.send(data).
    // then(() => logToTerminal('Устройство перезагружается', 'out')).
    catch((error) => logToTerminal(error));}
  else if (data == 'AT+BEFC200') {
    // flag = 'set_parameter';
    terminal.send(data).
    // then(() => logToTerminal('Гирлянда включена', 'out')).
    catch((error) => logToTerminal(error));}
  else if (data == 'AT+BEFC000') {
    // flag = 'set_parameter';
    terminal.send(data).
    // then(() => logToTerminal('Гирлянда выключена', 'out')).
    catch((error) => logToTerminal(error));}
  else {
    // flag = 'None';
    terminal.send(data).
    // then(() => logToTerminal('Leds OFF', 'out')).
    catch((error) => logToTerminal(error));}    
};

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
    flag = 'set_parameter';
    sendcmd('AT+BEFC200');
    setTimeout(() => {  sendcmd('AT+AFTC200'); }, 200);
    // setTimeout(() => {  send('AT+PIO21'); }, 1000);
    setTimeout(() => {  sendcmd('AT+RESET'); }, 400);
  }
);

ledoffButton.addEventListener(
  'click', () => {
    flag = 'set_parameter';
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
    setTimeout(() => {  sendcmd('AT+BATT?'); }, 200);
  }
);


sendForm.addEventListener('submit', (event) => {
  event.preventDefault();
  flag = 'None';
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
