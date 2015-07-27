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

	var child = exec("ps aux",
		function (error, stdout, stderr) {
			if (stdout.split(__filename).length > threshold){
				//console.log("Already running ",stdout.split(__filename).length)
				//log.info('[update_bib] Already running instance count: ', stdout.split('update_bib_new.js').length )
				//console.log("Already running")
				cb(true)
			}else{
				//console.log("Not running",__filename,stdout.split(__filename).length)
				cb(false)
			}
	})

}

//our own exit method to kill the process but allow the logger to finish up anything it is doing
exports.exit = function(){
	setTimeout(function(){process.exit()},2000)
}
