#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0

var total = 0, ourOCLC = 0, classifyWorked = 0, hasLCC = 0, foundOclc = 0


db.allBibs(function(bib,cursor,mongoConnection){

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + "" )

	counter++


	if (bib['sc:classifyCheck']){

		total++

		if (bib['sc:oclc']){
			if (bib['sc:oclc'].length > 0) ourOCLC++
		}
	
		if (bib['classify:owi']) classifyWorked++

		if (typeof bib['classify:lcc'] ==='string') hasLCC++


		if (bib['sc:oclc'].length == 0){
			if (bib['classify:oclc']){
				if (bib['classify:oclc'].length > 0) foundOclc++
			}
		}

		//console.log("|", bib['sc:oclc'].length, bib['classify:owi'],typeof bib['classify:lcc'], typeof bib['classify:oclc'])

		console.log("|", "Total:",total, "We had OCLC:",ourOCLC, "Classify worked:",classifyWorked, "Has LCC:",hasLCC, "Found new OCLC:",foundOclc   )


		
		
	}

	cursor.resume()


})


