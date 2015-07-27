var config = require("config")
var exec = require('child_process').exec

var exports = module.exports = {};





exports.checkBibUpdateTime = function(returnTimeOnly){

	var runWindow = config['BibUpdate']['runWindow']
	var date = new Date()
	var currentHour = date.getHours()

	if (returnTimeOnly) return (runWindow)

	if (runWindow.indexOf(parseInt(currentHour)) == -1 ){
		return false
	}else{
		return true
	}

}

exports.checkItemUpdateTime = function(returnTimeOnly){

	var runWindow = config['ItemUpdate']['runWindow']
	var date = new Date()
	var currentHour = date.getHours()

	if (returnTimeOnly) return (runWindow)

	if (runWindow.indexOf(parseInt(currentHour)) == -1 ){
		return false
	}else{
		return true
	}

}


//check for the filename of the script running in ps aux output and return true if it is already listed
exports.checkIfRunning = function(cb,threshold){

	//on linux servers running this as a cron job it will be 3
	if (!threshold) threshold = 3

	var scriptName = __filename.split("/")[__filename.split("/").length-1]

	var child = exec("ps aux",
		function (error, stdout, stderr) {
			if (stdout.split(scriptName).length > threshold){
				cb(true)
			}else{
				cb(false)
			}
	})

}

//our own exit method to kill the process but allow the logger to finish up anything it is doing
exports.exit = function(){
	setTimeout(function(){process.exit()},2000)
}
