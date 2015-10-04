#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0
var totalChanged = 0



db.allBibs(function(bib,cursor,mongoConnection){

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + " | " + totalChanged)


	if (!bib){
		console.log("Complete:", counter + " | " + totalChanged)
		return true;
	}

	counter++


	//build out the data we would use in classify
	var data = {
		_id: bib._id,
		oclc : []
	}

	if (bib['sc:oclc']){
		for (var x in bib['sc:oclc']){
			if (data.oclc.indexOf(bib['sc:oclc'][x]) == -1) data.oclc.push(bib['sc:oclc'][x])			
		}
	}

	if (bib['lc:oclc']){
		for (var x in bib['lc:oclc']){
			if (data.oclc.indexOf(bib['lc:oclc'][x]) == -1) data.oclc.push(bib['lc:oclc'][x])
		}
	}

	if (bib['classify:oclc']){
		for (var x in bib['classify:oclc']){
			if (data.oclc.indexOf(bib['classify:oclc'][x]) == -1) data.oclc.push(bib['classify:oclc'][x])
		}
	}
	
	if (data.oclc.length>0){

		db.insertAPIWorldcatRecord(data,function(err,results){

			totalChanged++

		

			//console.log(data)
			//if (results) console.log(results.result)
			cursor.resume()

			return true
		})
	}else{
		cursor.resume()
	}

	
	return true



})

