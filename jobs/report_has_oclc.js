#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0
var hasOclc = 0

db.allBibs(function(bib,cursor,mongoConnection){

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + " | " +  hasOclc )

	counter++

	if (!bib) console.log("DONE!", counter, hasOclc)

	var oclcFlag = false


	if (bib['sc:oclc']){
		if (bib['sc:oclc'].length > 0) oclcFlag = true
	}
	if (bib['classify:oclc']){
		if (bib['classify:oclc'].length > 0) oclcFlag = true
	}
	if (bib['lc:oclc']){
		if (bib['lc:oclc'].length > 0) oclcFlag = true
	}

	if (oclcFlag) hasOclc++
		

	cursor.resume()


})


