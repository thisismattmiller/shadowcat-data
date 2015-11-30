#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

counter = 0

db.allBibs(function(bib,cursor,mongoConnection){


	if (!bib){
		console.log("That's it!")
		return true
	}

	

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + "" )

	counter++

	//pause the so we can work on the current record
	cursor.pause()



	console.log("Bib record:")
	console.log(bib)


	//ask 
	db.returnItemByBibIds(bib.id,function(err,items){
			

		console.log("Item records:")
		console.log(items)




		// var updateRecord  = {
		// 	id : bib.id,
		// 	"whatever field" : "new value"
		// }

		// db.updateBibRecord(updateRecord,function(err,r){

		// 	if (err) console.log("ERRROR:",err)

		// 	console.log(updateRecord)
		// 	console.log(r.result)
		// 	cursor.resume()

		// }, mongoConnection)


		//we are resuming the record here
		cursor.resume()
		//but if are updating it we need to resume in the callback of the update function, cursor.resume() should only be called once



	}, mongoConnection)


})


