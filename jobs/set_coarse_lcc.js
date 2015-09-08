#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0
var totalChanged = 0

var log = require('simple-node-logger').createSimpleLogger(__dirname + '/../log/coarse_lcc_error.log');

util.parseLCC(function(allLccs){

	db.allBibs(function(bib,cursor,mongoConnection){

		process.stdout.clearLine()
		process.stdout.cursorTo(0)
		process.stdout.write( counter + " | " + totalChanged + " | " )

		counter++

		if (!bib['classify:lcc'] || bib['sc:lccCoarse'] === false){


			//see if we have the lcc in the 050		
			var lcc = false, lcc908 = false, possibleLcc = []


			for (var field in bib.varFields){
				if (bib.varFields[field].marcTag == '050') lcc = bib.varFields[field]
				if (bib.varFields[field].marcTag == '908') lcc908 = bib.varFields[field]
			}

			//if (!lcc && lccn) console.log("|",bib.id, lcc,lccn )

			if (lcc){

				var subfieldA = false
				var allfields = false

				for (var x in lcc.subfields){
					if (lcc.subfields[x].tag==='a'){
						 if (lcc.subfields[x]['content']) {
						 	subfieldA = lcc.subfields[x]['content']
						 	allfields = lcc
						 }
					}
				}

				if (subfieldA) possibleLcc.push(subfieldA)

			}
			if (lcc908){
				var subfieldA = false
				var allfields = false
				for (var x in lcc908.subfields){
					if (lcc908.subfields[x].tag==='a'){
						 if (lcc908.subfields[x]['content']) {
						 	subfieldA = lcc908.subfields[x]['content']
						 	allfields = lcc908
						 }
					}
				}
				if (subfieldA) possibleLcc.push(subfieldA)
			}


			//see if we have it from the LCCN api

			if (bib['lc:lcc']){
				possibleLcc.push(bib['lc:lcc'])
			}



			for (var x in possibleLcc){


			
				var coarse = util.coarseLCC(possibleLcc[x],allLccs)

				if (coarse){

					var updateRecord  = {
						id : bib.id,
						"sc:lccCoarse" : coarse
					}

					db.updateBibRecord(updateRecord,function(err,r){
						if (err) console.log("ERRROR:",err)
						totalChanged++
						cursor.resume()
						return
					}, mongoConnection)



				}else{
					log.info(possibleLcc[x])
				}


			}

			cursor.resume()





			

		}else{



			//if it has the classify LCC use that instead
			var updateRecord  = {
				id : bib.id,
				"sc:lccCoarse" : util.coarseLCC(bib['classify:lcc'],allLccs)
			}


			if (!updateRecord["sc:lccCoarse"]) log.info(bib['classify:lcc'])
			db.updateBibRecord(updateRecord,function(err,r){

			 	if (err) console.log("ERRROR:",err)
				cursor.resume()

			}, mongoConnection)

			
		}




	})

})

