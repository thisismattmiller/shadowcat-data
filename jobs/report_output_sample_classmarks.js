#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")
var fs = require("fs")
var counter = 0
var codes = {}

var classmark = "YMI".toLowerCase()
var filename = __dirname + "/../log/" + classmark + ".json"


fs.unlink(filename, function (err) {

	db.returnCollection("bib",function(err,bibs,database){

		var cursor = bibs.find({'sc:classmark':classmark})
		
		cursor.on('data', function(bib) {


			cursor.pause()

			fs.appendFile(filename, JSON.stringify(bib) + "\n", function (err) {
				if (err) console.log(err)
				console.log(++counter)
				cursor.resume()
			})



		})


		cursor.once('end', function() {
				
			setTimeout(function(){
				
				database.close()

			},5000)

		})





	})

})
