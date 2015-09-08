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


	if (bib['sc:oclc'] || bib['classify:oclc'] || bib['lc:oclc']){
		hasOclc++
	}

	cursor.resume()


})


