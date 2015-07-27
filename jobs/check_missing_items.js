#!/usr/local/bin/node

var db = require("./db.js")

var counter = 0


db.allBibs(function(doc,cursor,mongoConnection){

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + "" )

	counter++


	


	db.returnItemBy(doc.id,function(err,docs){

			
		if (docs.length > 0){



		}else{

			console.log("No item record:",doc.id)


		}

		
		cursor.resume()

	}, mongoConnection)
	





})

