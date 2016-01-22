#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")
var fs = require("fs")

var counter = 0, found = 0

//var logHere = require('simple-node-logger').createSimpleLogger(__dirname + '/../log/multiple_260.log')


var file = fs.createWriteStream("log/allBnumbers.txt")
file.on('error', function(err) { console.log(err) })
file.on('finish', function () {
	console.log("DONE!")
})

db.allBibs(function(bib,cursor,mongoConnection){

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter +""  )

	if (!bib){

		file.end()
		return true
	}

	counter++

	file.write( bib._id + '\n')
	cursor.resume()


})



