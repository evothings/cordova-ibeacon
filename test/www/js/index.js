
function uint8ArrToHexStringNoSpace(arr) {
	if(typeof arr == "string") {
		return arr;
	}
	return Array.prototype.map.call(arr, function(n) {
		var s = n.toString(16);
		if(s.length == 1) {
			s = '0'+s;
		}
		return s;
	}).join('');
}

function appendTd(root, value, id) {
	var text = document.createTextNode(value);
	var td = document.createElement("td");
	if(id) {
		td.id = id;
	}
	td.appendChild(text);
	root.appendChild(td);
}

function hex16(i) {
	var s = i.toString(16);
	while(s.length < 4) {
		s = '0'+s;
	}
	return s;
}

var beacons = {};

var app = {
	initialize: function() {
		// Important to stop scanning when page reloads/closes!
		window.addEventListener('beforeunload', function(e)
		{
			iBeacon.stopScan();
		});

		this.bindEvents();
	},
	bindEvents: function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);
	},
	onDeviceReady: function() {
		//app.receivedEvent('deviceready');
		app.startScan();
	},
	receivedEvent: function(id) {
		var parentElement = document.getElementById(id);
		var listeningElement = parentElement.querySelector('.listening');
		var receivedElement = parentElement.querySelector('.received');

		listeningElement.setAttribute('style', 'display:none;');
		receivedElement.setAttribute('style', 'display:block;');

		console.log('Received Event: ' + id);
	},

	startScan: function() {
		var regions =[
			{uuid:'B9407F30-F5F8-466E-AFF9-25556B57FE6D'},
			{uuid:'F7826DA6-4FA2-4E98-8024-BC5B71E0893E'},
			{uuid:'8DEEFBB9-F738-4297-8040-96668BB44281'},
			{uuid:'A0B13730-3A9A-11E3-AA6E-0800200C9A66'},
		]
		iBeacon.startScan(regions, function(beacon) {
			//console.log(JSON.stringify(beacon));
			//console.log("beacon found: "+beacon.address+" "+beacon.name+" "+beacon.rssi+"/"+beacon.txPower);
			var r = beacon.region;
			//console.log("M"+r.major.toString(16)+" m"+r.minor.toString(16)+" uuid "+uint8ArrToHexStringNoSpace(r.uuid));
			var key;
			if(beacon.address) {	// android
				key = 'tx'+beacon.address.replace(/:/g,'_');
			} else {	// ios
				key = 'tx'+beacon.uuid.replace(/-/g,'_') + hex16(r.major)+"_"+hex16(r.minor);
			}
			var distance;
			if(beacon.estimatedDistance && beacon.txPower) {	// android
				distance = beacon.txPower+"\u00A0"+beacon.estimatedDistance.toFixed(2)+'m';
			} else {	// ios
				distance = beacon.proximity;
			}
			//console.log('key: '+key);
			if(beacons[key] == null) {
				var root = document.getElementById("beaconListRoot");
				var tr = document.createElement("tr");
				// <tr><td>Address</td><td>Name</td><td>RSSI</td><td>ID</td><td>UUID</td></tr>
				appendTd(tr, beacon.address);
				appendTd(tr, beacon.name);
				appendTd(tr, beacon.rssi+"/"+distance, key);
				appendTd(tr, hex16(r.major)+"\u00A0"+hex16(r.minor));
				appendTd(tr, uint8ArrToHexStringNoSpace(r.uuid));
				root.appendChild(tr);
				beacons[key] = beacon;
			} else {
				var td = document.getElementById(key);
				td.firstChild.nodeValue = beacon.rssi+"/"+distance;
			}
		}, function(error) {
			console.log("startScan error: " + error);
		});
	},
};
