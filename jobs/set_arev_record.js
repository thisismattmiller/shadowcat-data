#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0
var arev = 0

db.allBibs(function(bib,cursor,mongoConnection){


	if (!bib){
		console.log("That's it!")
		return true
	}



	//pause the so we can work on the current record
	cursor.pause()


	if ( JSON.stringify(bib).search(/AREV\s/) != -1 ){
		

		console.log(bib._id)
		arev++

		cursor.resume()



	}else{

		cursor.resume()

	}




	counter++

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + " | " + arev + " | " )

	





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




})


