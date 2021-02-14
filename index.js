const TWENTY_FIVE_MEGAHERTZ = 25000000,
  TWELVE_BITS = 4096,
  NANOSECONDS_IN_SECOND = 1000000,
  REGISTERS = {
    "MODE": 0x00,
    "PRESCALE": 0xFE,
    "PULSE_ON_L": 0x06,
    "PULSE_ON_H": 0x07,
    "PULSE_OFF_L": 0x08,
    "PULSE_OFF_H": 0x09,
    "ALL_ON_L": 0xFA,
    "ALL_ON_H": 0xFB,
    "ALL_OFF_L": 0xFC,
    "ALL_OFF_H": 0xFD
  },
  VALIDATE = {
    "channel": function (channel) {
      return (channel > -1 && channel < 16);
    },
    "pwm": function (pwmValues) {
      if (typeof pwmValues === 'number') {
        pwmValues = [pwmValues]
      }

      //Validate each passed in value
      for (let pwmValue of pwmValues) {
        if (pwmValue < 0 || pwmValue > 4096) {
          return false;
        }
      }

      return true;
    },
    "pulse": function (pulse, frequency) {
      return (pulse > -1 && pulse < 1000000 / frequency);
    }
  }

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = class PCA9685{
  constructor(addr, comm, config) {
    this.config = config || {};
    this.comm = comm;
    this.addr = addr;
    this.settable = ['all'];
    this.status = {
      channels: {}
    };

    //Initialize Channels
    if (this.config.channels) {
      for (let i = 0; i < this.config.channels; i++) {
        let channelName = `channel_${i}`;
        this.settable.push(channelName);
        this.status.channels[i] = {
          pulseOn: 0,
          pulseOff: 0
        };
      }
    }

    this.status.initialized = false;
    this.init().then(r => {
      console.debug(`PCA9685 Initialized`);
    });
  }

  async init(){
    try {
      //Set chip to standby
      console.debug(`Setting chip to standby`);
      await this.comm.writeBytes(this.addr, REGISTERS.MODE, 0x00);
      console.debug(`Set chip to standby`);
      //Set chip pre-scale value
      console.debug(`Setting chip prescale value`);
      await this.setPwmFrequency(this.config.frequency, this.config.correctionFactor);
      //Stop all PWM
      console.debug(`Stopping all PWM`);
      await this.stop();
      //Mark chip as initialized
      this.status.initialized = true;
      console.debug(`PCA9685 Chip Initialized`);
    } catch (err) {
      let errorMessage = `Error initializing PCA9685`;
      console.error(err.message || errorMessage);
      throw new Error(err);
    }
  }

  async getStatus() {
    return this.status;
  }

  async setPwmFrequency(frequency, correctionFactor) {
    try {
      if (frequency < 40 || frequency > 4096) {
        throw new Error("Frequency is invalid.  Valid Input 40 - 1000 Hz");
      }

      correctionFactor = correctionFactor || 1;

      let prescaleValue = (((TWENTY_FIVE_MEGAHERTZ / TWELVE_BITS) / frequency) - 1);
      let prescale = Math.floor(prescaleValue * correctionFactor + 0.5);
      //Save currentMode of chip
      let originalMode = await this.comm.readBytes(this.addr, REGISTERS.MODE, 1);
      //Set chip mode to standby (Turn off oscillator to prescale value)
      let newMode = (originalMode & 0x7F) | 0x10;
      await this.comm.writeBytes(this.addr, REGISTERS.MODE, newMode);
      //Set prescale value
      await this.comm.writeBytes(this.addr, REGISTERS.PRESCALE, prescale);
      //Set board back to original mode
      try {
        await this.comm.writeBytes(this.addr, REGISTERS.MODE, originalMode);
      } catch (err) {
        //Ignore error.  Board reboots and does not send ACK
      }
      //Wait for chip restart
      await sleep(1000);
      //Clear restart bit
      await this.comm.writeBytes(this.addr, REGISTERS.MODE, originalMode | 0x80);

      this.status.pwmFrequency = frequency;
      this.status.correctionFactor = correctionFactor;
    } catch (err) {
      console.error(`Error setting PWM pre-scale frequency`);
      throw new Error(err);
    }
  }

  async setPwm(channel, pulseOn, pulseOff) {
    try {
      if (VALIDATE.channel(channel) === false) {
        throw new Error("Invalid channel");
      }

      if (VALIDATE.pwm([pulseOn, pulseOff]) === false) {
        throw new Error("Invalid PWM value.  Accepted values 0-4096")
      }

      //Set bytes of pulse on and off each separated into 2 registers.
      await this.comm.writeBytes(this.addr, REGISTERS.PULSE_ON_L + 4 * channel, pulseOn & 0xFF);
      await this.comm.writeBytes(this.addr, REGISTERS.PULSE_ON_H + 4 * channel, pulseOn >> 8);
      await this.comm.writeBytes(this.addr, REGISTERS.PULSE_OFF_L + 4 * channel, pulseOff & 0xFF);
      await this.comm.writeBytes(this.addr, REGISTERS.PULSE_OFF_H + 4 * channel, pulseOff >> 8);

      this.status.channels[channel] = {
        pulseOn: pulseOn,
        pulseOff: pulseOff
      };

      //Buffer for command to complete
    } catch (err) {
      let errorMessage = `Error setting PWM for channel ${channel} [${pulseOn} - ${pulseOff}]. Err: ${err.message}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async setPulse(channel, pulse) {
    try {
      if (VALIDATE.channel(channel) === false) {
        throw new Error("Invalid channel");
      }

      if (VALIDATE.pulse(pulse, this.config.frequency) === false) {
        throw new Error("Invalid pulse. Pulse must be > 0 and less than PWM period");
      }

      let pulseLength = (NANOSECONDS_IN_SECOND / this.config.frequency) / TWELVE_BITS;
      await this.setPwm(channel, 0, Math.floor(pulse / pulseLength));
    } catch (err) {
      let errorMessage = `Error setting pulse on CH: ${channel}, Pulse: ${pulse}. Err: ${err.message}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async stop() {
    try {
      await this.comm.writeBytes(this.addr, REGISTERS.ALL_OFF_H, 0x10);
    } catch (err) {
      let errorMessage = `Error stopping pulse on ALL channels. Err: ${err.message}`
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
};
