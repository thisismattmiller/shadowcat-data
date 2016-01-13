#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0, found = 0

var logHere = require('simple-node-logger').createSimpleLogger(__dirname + '/../log/multiple_260.log')


db.allBibs(function(bib,cursor,mongoConnection){

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + " " + found )

	counter++


	var j = JSON.stringify(bib)
	var l = j.split(/"marcTag":"260"/).length

	if (l > 3){
		logHere.info(bib._id + "," + l-1)
		found++
	}

	cursor.resume()







})


