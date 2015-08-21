#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0


var extract852 = function(obj){

	var results = []

	if (obj.marcTag){
		if (obj.marcTag === '852'){
			if (obj.subfields){
				for (var x in obj.subfields){
					if (obj.subfields[x].tag){
						if (obj.subfields[x].tag.trim().toLowerCase() === 'h'){
							if (obj.subfields[x].content) results.push(obj.subfields[x].content)
						}
						if (obj.subfields[x].tag.trim().toLowerCase() === 'k'){
							if (obj.subfields[x].content) results.push(obj.subfields[x].content)
						}
					}
				}
			}
		}
	}
	return results
}


//some early messed up records that should go into the research pile

util.parseLocationFile(function(locations){

	db.allBibs(function(bib,cursor,mongoConnection){

		process.stdout.clearLine()
		process.stdout.cursorTo(0)
		process.stdout.write( counter + "" )

		counter++



		var mapResults = bib.varFields.map(extract852)



		var callNumbers = []

		for (var x in mapResults){

			for (var y in mapResults[x]){


				if (mapResults[x][y] && callNumbers.indexOf(mapResults[x][y].trim()) === -1) callNumbers.push(mapResults[x][y])
			}
		}


		var results = []

		for (var x in callNumbers){

			var c = util.cleanClassMark(callNumbers[x])

			for (var y in c){
				if (results.indexOf(c[y]) === -1) results.push(c[y])
			}
			


		}


		var newResults = []

		if (results.length>1){

				
			if (results.indexOf(false) >-1){
				for (var x in results){
					if (results[x] !== false) newResults.push(results[x])
				}
			}else{
				newResults = results
			}


		}else{
			newResults = results
		}

		if (results.length == 0) newResults = false

		if (!newResults){

			console.log("|",bib.id,newResults)

		}



		var updateRecord  = {
			id : bib.id,
			"sc:classmark" : newResults
		}

		db.updateBibRecord(updateRecord,function(err,r){

			if (err) console.log("ERRROR:",err)

			console.log(updateRecord)
			console.log(r.result)
			cursor.resume()

		}, mongoConnection)




	})




})
