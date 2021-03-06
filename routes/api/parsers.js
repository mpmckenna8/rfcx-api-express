var zlib = require("zlib");
var fs = require("fs");

exports.parsers = {

  processCheckIn: function(req,res,callback) {
    var unZippedPath = "/tmp/"+(new Date()).valueOf()+".json";
    var unZippedStream = fs.createWriteStream(unZippedPath);
    fs.createReadStream(req.files.blob.path).pipe(zlib.createGunzip()).pipe(unZippedStream);
    unZippedStream.on("close",function(){
      fs.readFile(unZippedPath,function(err,unZippedJSON){
        if (err) {
          console.log("Failed to open unzipped JSON file: "+unZippedPath);
        } else {
          
          callback(req,res,parseCheckInJSON(JSON.parse(unZippedJSON)));

          fs.unlink(unZippedPath, function(err){
            if (err) { console.log("Failed to delete unzipped JSON file after usage..."); }
          });

        }
      });
    });

  }


}

function parseCheckInJSON(json) {
  var d = {
    uuid: json.uuid,
    appVersion: json.appV,
    isCharging: json.powr,
    isCharged: json.chrg,
    batteryPercent: json.batt,
    batteryTemp: json.temp,
    networkSearch: json.srch,
    specT: [],
    specV: [],
    specC: [],
    sms: [],
    sent: Date.parse(json.sent)
  }; 

  d.lum = (json.lumn !== null) ? json.lumn.split(",") : [];
  d.lumAvg = 0;
  d.cpuP = (json.cpuP !== null) ? json.cpuP.split(",") : [];
  d.cpuPAvg = 0;
  d.cpuC = (json.cpuC !== null) ? json.cpuC.split(",") : [];
  d.cpuCAvg = 0;
  for (var i = 0; i < d.lum.length; i++) { d.lumAvg = d.lumAvg + parseInt(d.lum[i]); }
    if (d.lumAvg > 0) { d.lumAvg = Math.round(d.lumAvg / d.lum.length); }
  for (var i = 0; i < d.cpuP.length; i++) { d.cpuPAvg = d.cpuPAvg + parseInt(d.cpuP[i]); }
    if (d.cpuPAvg > 0) { d.cpuPAvg = Math.round(d.cpuPAvg / d.cpuP.length); }
  for (var i = 0; i < d.cpuC.length; i++) { d.cpuCAvg = d.cpuCAvg + parseInt(d.cpuC[i]); }
    if (d.cpuCAvg > 0) { d.cpuCAvg = Math.round(d.cpuCAvg / d.cpuC.length); }

  var dateMs = parseInt(d.sent.valueOf());
  
  var specTimes = json.specT.split(",");
  for (var i = 0; i < specTimes.length; i++) {
    d.specT[i] = new Date(dateMs-(parseInt(specTimes[i],16)*1000));
  }
  d.specC = specTimes.length;
  
  var specGroup = json.specV.split("*");
  for (var g = 0; g < d.specC; g++) {
    d.specV[g] = [];
    var specHex = specGroup[g].split(",");
    for (var i = 0; i < specHex.length; i++) { d.specV[g][i] = parseInt(specHex[i], 16); }
  }
  
  var smsMsgs = json.sms.split("$");
  for (var i = 0; i < smsMsgs.length; i++) { d.sms[i] = smsMsgs[i].split("|"); }

  if (json.lastId != null) { d.lastCheckInId = parseInt(json.lastId); }
  if (json.lastLen != null) { d.lastCheckInDuration = parseInt(json.lastLen); }

  return d;
}