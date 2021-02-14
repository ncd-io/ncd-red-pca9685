const comms = require('ncd-red-comm');
const PCA9685 = require('./index.js');

/*
 * Allows use of a USB to I2C converter form ncd.io
 */
// var port = '/dev/tty.usbserial-DN04EUP8';
let port = 'COM6';
let serial = new comms.NcdSerial(port, 115200);
let comm = new comms.NcdSerialI2C(serial, 0);

/*
 * Use the native I2C port on the Raspberry Pi
 */
//var comm = new comms.NcdI2C(1);

let config = {
  frequency: 55,
  channels: 8,
  correctionFactor: 1,
  comm: comm
};
let address = 64;
let driver = new PCA9685(address, comm, config);

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAllChannels(pulseValue = 4096, runCount = 0){
  try {
    while(driver.status.initialized === false) {
      //Check for initialization every 10ms
      await sleep(10);
    }

    if (runCount === 20) {
      return true;
    }
    console.log(`Setting Pulse Value to ${pulseValue}`);
    for (let i = 0; i < config.channels; i++) {
      console.log(`CH: ${i}`);
      await driver.setPwm(i, pulseValue, 0);
    }
    setTimeout(testAllChannels, 100, getRandomInt(4000), (runCount + 1))
  } catch (err) {
    console.error(err.message || JSON.stringify(err));
    throw new Error(err);
  }
}

console.log(`Test Started`);
testAllChannels().then(r => {
  console.log(`Test Completed`);
});
