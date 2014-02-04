function b64ToUint6 (nChr) {

  return nChr > 64 && nChr < 91 ?
      nChr - 65
    : nChr > 96 && nChr < 123 ?
      nChr - 71
    : nChr > 47 && nChr < 58 ?
      nChr + 4
    : nChr === 43 ?
      62
    : nChr === 47 ?
      63
    :
      0;

}

function base64DecToArr (sBase64, nBlocksSize) {

  var
    sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
    nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

  for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3;
    nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
      }
      nUint24 = 0;

    }
  }

  return taBytes;
}

window.iBeacon = {

/** Start scanning for beacons.
* <p>Found devices and errors will be reported to the supplied callbacks.</p>
* <p>Will keep scanning indefinitely until you call stopScan().</p>
* <p>Calling this function while scanning is in progress will continue scanning with the new region.</p>
* @param {Region} region - All components are optional. Beacons will be filtered based on the components that are present.
* If no components are present, all beacons in range will be reported.
* @param {scanCallback} win
* @param {failCallback} fail
*/
startScan: function(region, win, fail) {
	evothings.ble.startScan(function(device) {
		var sr = base64DecToArr(device.scanRecord);
		console.log("found device: srl " + sr.byteLength + "("+device.scanRecord.length+"), name: " + device.name);
		console.log(Array.prototype.map.call(sr, function(n) {
			var s = n.toString(16);
			if(s.length == 1) {
				s = '0'+s;
			}
			return s;
		}).join(' '));
		//console.log(device.scanRecord);
		if(sr.byteLength == 30) {
			var beacon = parseScanRecord(device, sr);
			var filtered = (region && ((region.uuid && beacon.uuid != region.uuid) ||
				(region.major && region.major != beacon.major) ||
				(region.minor && region.minor != beacon.minor)));
			if(filtered) {
				return;
			}
			win(beacon);
		}
	}, fail);
},

// returns a Beacon
parseScanRecord: function(device, sr) {
	var b = device;
	b.region = {
		uuid: sr[9,16],
		major: sr[25,2],
		major: sr[27,2],
	}
	b.txPower = sr[29];
	// power = C * sqrt(distance)
	// distance = power^2 * C
	// decibel = power^x
	// distance = decibel * C
	b.estimatedDistance = b.rssi / b.txPower;
	b.state = 0;
	return b;
},

/** Describes an iBeacon region.
* @typedef {Object} Region
* @property {string} uuid - Formatted according to RFC 4122. Usually identifies the manufacturer of the beacon.
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
* @property {string} scanRecord - A string of bytes. For iBeacons, its length is always 9+16+2+2+1=30.
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
	evothings.ble.stopScan();
},

/** Connect to a beacon.
* <p>Will periodically update the device's RSSI and estimated distance, and report these values to the supplied callback.</p>
* <p>The callback will also be called when the connection state changes.
This is likely to happen often, as beacons move out of range, or back into range.</p>
* <p>When a connection is lost, the system will automatically try to reconnect, until you call disconnect().</p>
* @param {Beacon} beacon
* @param {connectCallback} win
* @param {failCallback} fail
*/
connect: function(beacon, win, fail) {
	evothings.ble.connect(beacon.address, function(handle, state) {
		beacon.state = state;
		beacon._handle = handle
		win(beacon);
		function doRssi() {
			evothings.ble.rssi(handle, rssiHandler, fail);
		}
		function rssiHandler(rssi) {
			beacon.rssi = rssi;
			beacon.estimatedDistance = beacon.rssi / beacon.txPower;
			win(beacon);
			setTimeout(doRssi, 1000);
		}
		doRssi();
	}, fail);
},

/** This function is a parameter to connect() and is called when a beacon's values are updated.
* @callback connectCallback
* @param {Beacon} beacon - The same object that was passed to connect().
* beacon.state will have been updated, though it may have the same value as before anyway.
* If beacon.state == STATE_CONNECTED, beacon.rssi and beacon.estimatedDistance will have been updated.
*/

/** Stop the connection to a beacon.
* @param {Beacon} beacon
*/
disconnect: function(beacon) {
	evothings.ble.close(beacon._handle);
},

};
