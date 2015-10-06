#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0


var extract037 = function(obj){

	var results = []

	if (obj.marcTag){
		if (obj.marcTag === '037'){
			if (obj.subfields){
				for (var x in obj.subfields){
					if (obj.subfields[x].tag === 'a') results.push(obj.subfields[x].content)
				}
			}
		}
	}

	
	return results
	
}

var flatten = function(results){
	var r = []

	for (var x in results){

		for (var y in results[x]){
			r.push(results[x][y])
		}

	}

	return r
}


db.allBibsReverse(function(bib,cursor,mongoConnection){

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + " | " )

	counter++

	var results = flatten(bib.varFields.map(extract037))

	var updateRecord  = {
		id : bib.id,
		"sc:stockNumber" : results
	}


	db.updateBibRecord(updateRecord,function(err,r){

		if (err) console.log("ERRROR:",err)

		//console.log(updateRecord)
		//console.log(r.result,bib._id)
		cursor.resume()

	}, mongoConnection)



})


