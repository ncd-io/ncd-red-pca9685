###This text and image should be replaced:
This library provides a class for the PCA9685, it relies on the ncd-red-comm library for communication, and includes a node-red node for PCA9685. AMS5812 pressure sensors are a series of high-precision OEM sensors with a digital I²C-interface. [Ncd.io](https://ncd.io) manufactures several mini-modules that utilize these sensors for different applications. You can see a [list here](https://store.ncd.io/?post_type=product&s=ams5812&site_select=https%3A%2F%2Fstore.ncd.io%3Fpost_type%3Dproduct).

[![AMS5812](./AMS5812.png)](https://store.ncd.io/?post_type=product&s=ams5812&site_select=https%3A%2F%2Fstore.ncd.io%3Fpost_type%3Dproduct)

### Installation

This library can be installed with npm with the following command:

```
npm install ncd-red-pca9685
```

For use in node-red, use the same command, but inside of your node-red directory (usually `~./node-red`).

### Usage

The `test.js` file included in this library contains basic examples for use.  All of the available configurations are available in the node-red node through the UI.

### Raspberry Pi Notes

If you intend to use this on the Raspberry Pi, you must ensure that:
1. I2C is enabled (there are plenty of tutorials on this that differ based on the Pi version.)
2. Node, NPM, and Node-red should be updated to the latest stable versions. If you skip this step the ncd-red-comm dependency may not load properly.
