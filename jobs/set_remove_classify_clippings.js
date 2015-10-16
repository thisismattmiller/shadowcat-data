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

	//if ( line.search(/"Clippings."/ig) > -1  || line.search(/"\*T-CLP"/ig)  ){
	if ( line.search(/"Clippings."/ig) > -1 || line.search(/\*T\-CLP/i) > -1 || line.search(/M\-Clippings/i) > -1 ){

		var removeClassifyWorldcat = false


		if (!bib['sc:oclc']) {
			removeClassifyWorldcat = true
		}else{

			if (bib['sc:oclc'].length == 0) {
				removeClassifyWorldcat = true
			} 

		}

			
		if (removeClassifyWorldcat){

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

	}else{
		cursor.resume()
	}




})


