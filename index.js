module.exports = class PCA9685{
	constructor(addr, comm, config){
		//ensure config is an object
		if(typeof config != 'object') config = {};

		//extend with default values
		this.config = Object.assign({
			range: 0,
			sType: "d",
			tempScale: "c",
			pScale: "mbar"
		}, config);

		//set default states and initialize
		this.comm = comm;
		this.addr = addr;
		this.initialized = false;
		this.status = {};
		this.raw = [];
		this.init();
	}
	init(){
		//Run initialization routine for the chip
		this.get().then().catch((err) => {
			console.log(err);
		});
	}
	parseStatus(status){
		//parse the retrieved values into real world values
		var range = this.config.range;
		var min = 0,
			max;

		switch(this.config.range){
			case 0:
				max = .075;
				break;
			case 1:
				max = .15;
				break;
			default:
				max = this.config.range/10;
				break;
		}

		if(this.config.sType.toLowerCase() == "d-b") min -= max;
		else if(this.config.sType.toLowerCase() == "b") min = 11;

		var pCounts = ((status[0] & 127) << 8) | status[1];
		var tCounts = ((status[2] & 127) << 8) | status[3];
		//mbar
		this.status.pressure = ((pCounts - 3277) / (26214 / (max-min)) + min) * this.config.pScale;
		//celsius
		this.status.temperature = ((tCounts - 3277) / (26214 / 110) + (-25));

		if(this.config.tempScale.toLowerCase() == "f") this.status.temperature = this.status.temperature * 1.8 + 32;
		else if(this.config.tempScale.toLowerCase() == "k") this.status.temperature += 273.15;

		return this.status;
	}
	get(){
		//Fetch the telemetry values from the chip
		return new Promise((fulfill, reject) => {
			this.comm.readBytes(this.addr, 4).then((r) => {
				this.initialized = true;
				fulfill(this.parseStatus(r));
			}).catch((err) => {
				this.initialized = false;
				reject(err);
			});
		});
	}
};
