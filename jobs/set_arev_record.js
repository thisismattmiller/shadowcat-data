#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0, arev = 0, arevId = 0, arevSupressed = 0

arevIdRegex = /AREV.*?([0-9]{2,}).*?\n/

db.allBibs(function(bib,cursor,mongoConnection){


	if (!bib){
		console.log("That's it!")
		return true
	}



	//pause the so we can work on the current record
	cursor.pause()

	var jsonString = JSON.stringify(bib,null,2)

	if ( jsonString.search(/AREV\s/) != -1 ){

		arev++

		if (bib.suppressed) arevSupressed++

		var updateRecord  = {
			id : bib.id,
			"sc:arev" : true,
			"sc:arevId" : false
		}

		var m = jsonString.match(arevIdRegex)
		if (m){
			arevId++
			var arevIdVal = parseInt(m[1])
			updateRecord['sc:arevId'] = arevIdVal
		}


		db.updateBibRecord(updateRecord,function(err,r){
			if (err) console.log("ERRROR:",err)
			cursor.resume()
		}, mongoConnection)	

	}else{
		cursor.resume()
	}




	counter++

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + " | arev: " + arev + " | arevId: " + arevId + " | arevSupressed: " + arevSupressed )




})


