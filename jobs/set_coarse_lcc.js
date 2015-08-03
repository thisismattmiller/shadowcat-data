#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0

var log = require('simple-node-logger').createSimpleLogger(__dirname + '/../log/coarse_lcc_error.log');


util.parseLCC(function(lcc){


	db.allBibs(function(bib,cursor,mongoConnection){

		process.stdout.clearLine()
		process.stdout.cursorTo(0)
		process.stdout.write( counter + "" )

		counter++


		if (bib['classify:lcc']){


			var updateRecord  = {
				id : bib.id,
				"sc:lccCoarse" : util.coarseLCC(bib['classify:lcc'],lcc)
			}


			db.updateBibRecord(updateRecord,function(err,r){

				if (err) console.log("ERRROR:",err)

				console.log(updateRecord)
				console.log(r.result)
				cursor.resume()

			}, mongoConnection)


		}else{

			cursor.resume()
			
		}




	})




})
