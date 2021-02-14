"use strict";

const PCA9685 = require("./index.js");

module.exports = function(RED){
  let driver_pool = {};

  function NcdI2cDeviceNode(config){
    RED.nodes.createNode(this, config);

    //set the address from config
    config.address = parseInt(config.address);
    this.addr = config.address;

    //set the channel count from config
    this.channelCount = parseInt(config.channelCount);

    //remove sensor reference if it exists
    if(typeof driver_pool[this.id] != 'undefined'){
      //Redeployment
      driver_pool[this.id].sensor.stop();
      delete(driver_pool[this.id]);
    }

    this.warn(RED.nodes.getNode(config.connection).i2c);
    this.warn(config);

    //create new sensor reference
    this.sensor = new PCA9685(config.address, RED.nodes.getNode(config.connection).i2c, config);

    let node = this;

    driver_pool[this.id] = {
      sensor: this.sensor,
      node: this
    };

    //Display device status on node
    function device_status(){
      if(node.sensor.status.initialized === false){
        node.status({fill:"red",shape:"ring",text:"disconnected"});
        return false;
      }
      node.status({fill:"green",shape:"dot",text:"connected"});
      return true;
    }

    //send telemetry data out the nodes output
    function send_payload(_status){
      let msg = [
        {topic: 'chip_status', payload: node.sensor.status.initialized}
      ];

      //Figure out how outputs are linked
      for (let sensor of node.sensor.status.channels) {
        msg.push({
          topic: `channel_1_pwm`,
          payload: sensor
        })
      }

      node.send(msg);
    }

    function getStatus() {
      return node.sensor.status;
    }

    async function emitStatus() {
      let status = await getStatus();
      let msg = [
        {topic: 'status', payload: JSON.stringify(node.sensor.status)}
      ];
      node.send(msg);
    }

    node.on('input', async (msg) => {
      //if status is requested, fetch it
      if(msg.topic === `get_status`){
        return emitStatus();
      }

      //Set channel PWM range
      if(msg.topic === `channel_pwm`) {
        await node.sensor.setPwm(msg.payload.channel, msg.payload.pulseOn, msg.payload.pulseOff);
        return emitStatus();
      }

      //Set channel PWM pulse
      if(msg.topic.indexOf(`channel_pulse`) === 0) {
        await node.sensor.setPulse(msg.payload.channel, msg.payload.pulse);
        return emitStatus();
      }

      //Set PWM Chip Pre-Scale Value
      if(msg.topic === `set_pwm_frequency`) {
        await node.sensor.setPwmFrequency(msg.payload);
        return emitStatus();
      }

      //Set PWM Chip Pre-Scale Value
      if(msg.topic === `stop`) {
        await node.sensor.stop();
        return emitStatus();
      }
    });

    //if node is removed, kill the sensor object
    node.on('close', async (removed, done) => {
      if(removed){
        await driver_pool[this.id].sensor.stop();
        delete(driver_pool[node.id]);
      }
      done();
    });

    emitStatus();
  }

  //register the node with Node-RED
  RED.nodes.registerType("ncd-pca9685", NcdI2cDeviceNode);
};
