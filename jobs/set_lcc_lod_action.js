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


	if (!bib['classify:lcc'] && !bib['sc:lccCoarse']){


	
		var lcc = false, lccn = false

		for (var field in bib.varFields){
			if (bib.varFields[field].marcTag == '050') lcc = bib.varFields[field]
			if (bib.varFields[field].marcTag == '010') lccn = bib.varFields[field]
		}



		//if (!lcc && lccn) console.log("|",bib.id, lcc,lccn )

		if (lccn){

			console.log(bib.id)
			console.log(lccn)

			// for (var x in lcc.subfields){
			// 	if (lcc.subfields[x].tag==='a'){
			// 		 if (lcc.subfields[x]['content']) {
			// 		 	subfieldA = lcc.subfields[x]['content']
			// 		 	allfields = lcc
			// 		 }
			// 	}
			// }



			cursor.resume()

		}else{

			cursor.resume()

		}

		

	}else{

		cursor.resume()
		
	}




})

