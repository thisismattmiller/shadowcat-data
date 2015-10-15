#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0, updated = 0



db.allBibsReverse(function(bib,cursor,mongoConnection){

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + " | " + updated )

	counter++

	var line = JSON.stringify(bib)

	if ( line.search(/Not for export in OCLC/ig) > -1 ){

		console.log("\n\n2",bib._id)
		++updated
		
		var update = {
			id : bib._id,
			"sc:local" : true,
			"classify:creatorLC": [],
			"classify:creatorVIAF": [],
			"classify:dcc": false,
			"classify:editions": false,
			"classify:eholdings":false,
			"classify:fast": [],
			"classify:format": false,
			"classify:holdings": false,
			"classify:itemtype": false,
			"classify:lcc": false,
			"classify:owi": false,
			"classify:oclc": [],
			"wc:aboutFast": [],
			"wc:aboutLcsh": [],
			"wc:aboutViaf": [],
			"wc:contributor": [],
			"wc:creator": [],
			"wc:datePublished": [],
			"wc:genre": []
		}

		db.updateBibRecord(update,function(){


			cursor.resume()


		},mongoConnection)




	}else{
		cursor.resume()
	}




})


