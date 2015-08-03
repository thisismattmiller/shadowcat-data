var config = require("config")
var fs = require("fs")
var csv = require("fast-csv")

var exec = require('child_process').exec

var exports = module.exports = {};

var coarseLCCRegExDecimal = new RegExp("^([A-Z]+)([0-9]+\.[0-9]+)")
var coarseLCCRegExNoDecimal = new RegExp("^([A-Z]+)([0-9]+)")




exports.coarseLCCLocate = function(prefix,number,lcc){


	//do we have this prefix
	if (lcc[prefix]){

		//loop through all them and try to locate where this one would fit in
		var matches = []

		for (var x in lcc[prefix]){

			if (number >= lcc[prefix][x].start && number <= lcc[prefix][x].stop ){


				matches.push(lcc[prefix][x])
			}
		}

		var mostParents = -1
		var use = false
		for (var x in matches){
			if (matches[x].parents.length > mostParents){
				use = matches[x].id
				mostParents = matches[x].parents.length
			}
		}

		return use

	}else{
		return false
	}
		

}

exports.extraCoarseLCCLocate = function(prefix,number,lcc){


	//do we have this prefix
	if (lcc[prefix]){

		//loop through all them locate who is the smallest parents

		var leastParents = 10000
		var use = false

		for (var x in lcc[prefix]){
			if (lcc[prefix][x].parents.length < leastParents){
				use = lcc[prefix][x].id
				leastParents = lcc[prefix][x].parents.length
			}
		}


		return use

	}else{
		return false
	}
		

}



exports.coarseLCC = function(mark,lcc){

	//strip down the LCC class mark to the prefix and numerical value
	var m = coarseLCCRegExDecimal.exec(mark)
	if (m===null) m = coarseLCCRegExNoDecimal.exec(mark)

	if (m===null) return false
	
	var prefix = m[1]
	var number = parseFloat(m[2])


	var r = exports.coarseLCCLocate(prefix,number,lcc)

	if (r) return r

	//go very coarse if we could not find a match
	r = exports.extraCoarseLCCLocate(prefix,number,lcc)
	

	return r


}

exports.parseLCC = function(cb){

	fs.readFile(__dirname + "/data/lcc_outlines.json", 'utf8', function (err, data) {

		if (err) throw err;

		var json = JSON.parse(data);

		cb(json)

	})

}


exports.parseLocationFile = function(cb){

	var locations = {}

	var stream = fs.createReadStream(__dirname + "/data/locations.csv")

	var csvStream = csv()
		.on("data", function(data){
	 		locations[data[0]] = {
	 			name : data[1],
	 			location : data[2],
	 			code : data[3],
	 			slug : data[4],
	 			lat : data[5],
	 			lng : data[6],
	 			research : data[7].toLowerCase()
	 		}
		})
		.on("end", function(){

			cb(locations)
		})

	stream.pipe(csvStream);

}

exports.isResearchBib = function(bib){


	//Bibcode 3 check
	//first check if it is bookset (e)
	if (bib.fixedFields){
		if (bib.fixedFields['31']){
			if (bib.fixedFields['31'].value){
				if (bib.fixedFields['31'].value === 'e') return false
			}
		}
	}

	//bib level
	//archives (7)
	//collection (c)
	//subunit (d)
	//include
	if (bib.bibLevel.code){
		if (['7','c','d'].indexOf(bib.bibLevel.code) > -1) return true

	}

	var line = JSON.stringify(bib).replace(/\s/g, "") 

	//do a broad reject of the records that have branch shelf locators
	if (line.search('"marcTag":"091"')>-1){
		//only if it does not have a resarch call number
		if (line.search('"marcTag":"852"')>-1){
			return true
		}else{
			return false
		}
	}

	//reject the dewey
	if (line.search('"marcTag":"082"')>-1){
		//only if it does not have a resarch call number
		if (line.search('"marcTag":"852"')>-1){
			return true
		}else{
			return false
		}
	}


	//okay, dunno, I guess it should go in
	return true



} 

exports.isResearchLocation = function(locations,allLocations){

	//if no codes then maybe
	if (locations.length === 0) return 'maybe'

	//we have strings here becuase we can have a 3rd maybe option
	var returnVal = 'false'

	for (var l in locations){

		if (allLocations[locations[l]]){
			if (allLocations[locations[l]].research === 'true'){
				returnVal = 'true'
				break
			}
		}

		if (allLocations[locations[l]]){
			if (allLocations[locations[l]].research === 'maybe'){
				returnVal = 'maybe'
			}
		}

	}


	return returnVal



}



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

	var scriptName = process.argv[1].split("/")[process.argv[1].split("/").length-1]

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
