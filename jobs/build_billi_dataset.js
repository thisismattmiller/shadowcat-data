#!/usr/local/bin/node

var db = require("../lib/db.js")

var counter = 0



var extract852 = function(obj){

	if (obj.marcTag){
		if (obj.marcTag === '852'){
			if (obj.subfields){
				for (var x in obj.subfields){
					if (obj.subfields[x].tag){
						if (obj.subfields[x].tag.trim().toLowerCase() === 'h'){
							if (obj.subfields[x].content) return obj.subfields[x].content
						}
					}
				}
			}
		}
	}
	return false
}

db.allBibs(function(doc,cursor,mongoConnection){

	// process.stdout.clearLine()
	// process.stdout.cursorTo(0)
	// process.stdout.write( counter + "" )

	// counter++


	
	if (doc["sc:research"]){

		if (doc.varFields){


			var mapResults = doc.varFields.map(extract852)
			var callNumbers = []

			for (var x in mapResults){
				if (mapResults[x] && callNumbers.indexOf(mapResults[x].trim()) === -1) callNumbers.push(mapResults[x])
			}
			

			for (var x in callNumbers){
				console.log(doc.id + " | " + callNumbers[x])
			}



		}
	

	}

	cursor.resume()



})

