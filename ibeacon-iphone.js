
window.iBeacon = {
	currentRegions: null,

/** Start scanning for beacons.
* <p>Found devices and errors will be reported to the supplied callbacks.</p>
* <p>Will keep scanning indefinitely until you call stopScan().</p>
* <p>Calling this function while scanning is in progress will continue scanning with the new region.</p>
* @param {Region} region - All components are optional. Beacons will be filtered based on the components that are present.
* If no components are present, all beacons in range will be reported.
* This parameter may be an array of regions.
* @param {scanCallback} win
* @param {failCallback} fail
*/
startScan: function(region, win, fail) {
	function createRegion(r) {
		var major = r.major ? r.major : null;
		var minor = r.minor ? r.minor : null;
		var identifier = r.uuid;
		return new IBeacon.CLBeaconRegion(r.uuid, major, minor, identifier);
	}
	iBeacon.stopScan();
	console.log("stopped scan");
	if(Array.isArray(region)) {
		currentRegions = [];
		for(var key in region) {
			var r = region[key];
			//currentRegions.push(new IBeacon.CLBeaconRegion(r.uuid, r.major, r.minor, r.uuid));
			currentRegions.push(createRegion(r));
		}
	} else {
		currentRegions = [createRegion(region)];
	}
	console.log("startRangingBeaconsInRegions");
	IBeacon.startRangingBeaconsInRegions(currentRegions,
		function(result) {
			//console.log("startRangingBeaconsInRegions callback");
			//console.log(JSON.stringify(result));
			//console.log(result.beacons.length);
			for(var key in result.beacons) {
				var b = result.beacons[key];
				var r = result.region;
				if(r.uuid && r.major && r.minor) {
					// if region is properly specified, we can reuse it.
					b.region = result.region;
				} else {
					// otherwise, construct a new one.
					b.region = {uuid:r.uuid, major:b.major, minor:b.minor};
				}
				// in either case, remove extra fields.
				b.major = undefined;
				b.minor = undefined;
				win(b);
			}
		});
},

/** Describes an iBeacon region.
* @typedef {Object} Region
* @property {Uint8Array} uuid - 16 bytes long. Usually identifies the manufacturer of the beacon.
* @property {number} major - Unsigned 16-bit integer. Usually identifies a particular set of beacons.
* @property {number} minor - Unsigned 16-bit integer. Usually identifies the beacon within a set.
*/

/** This function is a parameter to startScan() and is called when a new device is discovered.
* @callback scanCallback
* @param {Beacon} beacon
*/

/** Describes an individual iBeacon
* @typedef {Object} Beacon
* @property {string} address - Uniquely identifies the device. Pass this to connect().
* The form of the address depends on the host platform.
* @property {number} rssi - A negative integer, the signal strength in decibels.
* @property {string} name - The device's name, or nil.
* @property {string} scanRecord - Base64-encoded binary data.
* @property {Region} region - Parsed from scanRecord.
* @property {number} txPower - RSSI at a distance of 1 meter, measured by the manufacturer. Parsed from scanRecord.
* @property {number} estimatedDistance - Calculated from rssi and txPower.
* @property {number} state - Connection state. See ble.connectionState.
* @property {number} _handle - Connection handle. Written by connect() and read by disconnect(). DO NOT MODIFY!
*/

/** This function is called when an operation fails.
* @callback failCallback
* @param {string} errorString - A human-readable string that describes the error that occurred.
*/

/** Stop scanning.
*/
stopScan: function() {
	if(iBeacon.currentRegion) {
		IBeacon.stopRangingBeaconsInRegion(currentRegion);
		currentRegion = nil;
	}
},

};
