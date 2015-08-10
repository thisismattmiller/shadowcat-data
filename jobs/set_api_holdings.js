#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0
var totalChanged = 0

//var log = require('simple-node-logger').createSimpleLogger(__dirname + '/../log/coarse_lcc_error.log');


db.allBibs(function(bib,cursor,mongoConnection){

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + " | " + totalChanged )

	counter++

	var hasScOclc = (bib['sc:oclc']) ? true : false
	
	if (hasScOclc)  hasScOclc = ( bib['sc:oclc'].length > 0 ) ? true : false

	var hasClassifyOclc = (bib['classify:oclc']) ? true : false
	
	if (hasClassifyOclc)  hasClassifyOclc = ( bib['classify:oclc'].length > 0 ) ? true : false



	if (bib['classify:closeMatch'] && !hasScOclc && !hasClassifyOclc){

		if (bib['classify:closeMatch'].length > 0){
			

			

			var possiblities = []
			for (var aMatch in bib['classify:closeMatch']){

				aMatch = bib['classify:closeMatch'][aMatch]


				// oclcTitle = aMatch.title.replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s+/g,'').toLowerCase()
				// catalogTitle = bib.title.replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s+/g,'').toLowerCase()

				//if (oclcTitle === catalogTitle){
				if (bib.publishYear >= aMatch.lyr &&  bib.publishYear <= aMatch.hyr){
					//console.log(bib.id,aMatch.format, bib.materialType)
					//console.log(bib.id,aMatch.format, bib.bibLevel, aMatch.oclcNumber)
					possiblities.push(aMatch)

				}
					
				//}
				//console.log(oclcTitle)

			}

			if (possiblities.length>0){

				var insert = {

					'_id' : bib.id,
					closeMatch: possiblities

				}


				db.insertAPIHoldingsRecord(insert,function(err,results){

					cursor.resume()
					if (results) console.log(results.result)

				})

				return true
			}

		}

	}
	
	cursor.resume()





})

