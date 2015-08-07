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
		process.stdout.write( counter + " | " + totalChanged )

		counter++


		if (!bib['classify:lcc']){


		
			var lcc = false, lccn = false

			for (var field in bib.varFields){
				if (bib.varFields[field].marcTag == '050') lcc = bib.varFields[field]
				if (bib.varFields[field].marcTag == '010') lccn = bib.varFields[field]
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


				if (subfieldA) var results = util.coarseLCC(subfieldA,allLccs)

				if (results) {


					var updateRecord  = {
						id : bib.id,
						"sc:lccCoarse" : results
					}


					db.updateBibRecord(updateRecord,function(err,r){

						if (err) console.log("ERRROR:",err)

						console.log(updateRecord)
						console.log(r.result)
						totalChanged++
						cursor.resume()

					}, mongoConnection)



				}else{


					log.info(bib.id,"|",subfieldA)

					cursor.resume()
				}


			}else{

				cursor.resume()

			}

			

		}else{

			cursor.resume()
			
		}




	})

})

