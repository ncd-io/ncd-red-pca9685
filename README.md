This library provides a class for the PCA9685, it relies on the ncd-red-comm library for communication, and includes a node-red node for PCA9685.

[Picture of PCA9685 8 Channel FET Driver Board](https://media.ncd.io/sites/2/20170721150842/PCA9685_PEPWM8W8I12V_1.png)

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
