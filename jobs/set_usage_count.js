#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0


db.allBibs(function(bib,cursor,mongoConnection){


	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + "" )

	counter++


	//see if it has a item to get the locations
	db.returnItemByBibIds(bib.id,function(err,items){

		var usageCount = -1

			
		if (items.length > 0){

			usageCount = 0


			for (var x in items){

				if (items[x].fixedFields['76']){
					usageCount = usageCount + items[x].fixedFields['76'].value
				}
				if (items[x].fixedFields['77']){
					usageCount = usageCount + items[x].fixedFields['77'].value
				}

			}	
		}

		
		var updateRecord  = {
			id : bib.id,
			"sc:usageCount" : usageCount
		}		


		db.updateBibRecord(updateRecord,function(err,r){

			if (err) console.log("ERRROR:",err)

			console.log(updateRecord)
			console.log(r.result)
			cursor.resume()

		}, mongoConnection)

		
		
		

	}, mongoConnection)


	


	





})

