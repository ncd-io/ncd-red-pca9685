var comms = require('ncd-red-comm');
var PCA9685 = require('./index.js');

/*
 * Allows use of a USB to I2C converter form ncd.io
 */
var port = '/dev/tty.usbserial-DN04EUP8';
var serial = new comms.NcdSerial(port, 115200);
var comm = new comms.NcdSerialI2C(serial, 0);

/*
 * Use the native I2C port on the Raspberry Pi
 */
//var comm = new comms.NcdI2C(1);

var config = {
	range: 15,
	sType: "d",
	tempScale: "f"
};
var dac = new PCA9685(comm, config);

function testGet(){
	dac.get().then((r) => {
		console.log(r);
		setTimeout(testGet, 1000);
	}).catch(console.log);
}

testGet();
