#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")


var opts = {
    logDirectory: __dirname + '/../log',
    fileNamePattern: 'log-<date>.log',
    dateFormat:'YYYY.MM.DD'
};

var log = require('simple-node-logger').createRollingFileLogger( opts );

log.info('[update_sc_identifiers] Starting up script')


counter = 0



db.allBibsReverse(function(bib,cursor,mongoConnection){

	counter++


	if (counter > 500000){
		mongoConnection.close()
	}



	var results = util.extractScIdentifiers(bib)


	console.log(bib.id,results)
	cursor.resume()







	// var allCodes = []
	// var bibLocCode = 'multi'
	// if (bib.fixedFields['26']){
	// 	if (bib.fixedFields['26'].value){
	// 		bibLocCode = bib.fixedFields['26'].value
	// 	}else{
	// 		bibLocCode = 'multi'
	// 	}
	// }

	// if (bibLocCode != 'multi'){


	// 	bibLocCode = bibLocCode.trim().toLowerCase()

	// 	if (bibLocCode != ''){
	// 		if (!locations[bibLocCode]){
	// 			if (unknownCodes.indexOf(bibLocCode) == -1){
	// 				unknownCodes.push(code)
	// 				console.log("No location known for this:",bibLocCode)
	// 				log.info(bib.fixedFields['26'], bib.id)
	// 				bibLocCode = 'multi'
	// 			}
	// 		}else{
	// 			//this is our code, we know it exists 
	// 			allCodes = [bibLocCode]
	// 		}
	// 	}			

	// }


	// //if the code it multi then we don't know if this is a research item or not
	// //we need to ask for the item records and compare that code
	// if (allCodes.length == 0){

	// 	//see if it has a item to get the locations
	// 	db.returnItemByBibIds(bib.id,function(err,items){

				
	// 		if (items.length > 0){


	// 			for (var x in items){
	// 				var code = items[x].location.code.trim().toLowerCase()
	// 				if (locations[code]){
	// 					allCodes.push(code)
	// 				}else{
	// 					console.log("No location known for this:",items[x].location)
	// 					if (unknownCodes.indexOf(code) == -1){
	// 						unknownCodes.push(code)
	// 						log.info(items[x].location)
	// 					}								
	// 				}						
	// 			}	
	// 		}



	// 		var isResearch = util.isResearchLocation(allCodes,locations)

	// 		if (isResearch === 'false'){
	// 			isResearch = false
	// 		}else if (isResearch === 'true'){
	// 			isResearch = true
	// 		}else if (isResearch === 'maybe'){
	// 			isResearch = util.isResearchBib(bib)
	// 		}

	// 		var update = true

	// 		if (typeof bib['sc:research'] == 'boolean'){
	// 			if (bib['sc:research'] == isResearch) update = false
	// 		}

	// 		var updateRecord  = {
	// 			id : bib.id,
	// 			"sc:research" : isResearch
	// 		}

	// 		if (update){


	// 			console.log(isResearch, bib['sc:research'])
	// 			db.updateBibRecord(updateRecord,function(err,r){

	// 				if (err) console.log("ERRROR:",err)

	// 				cursor.resume()

	// 			}, mongoConnection)


	// 		}else{
	// 			cursor.resume()
	// 		}

			
			
	// 		cursor.resume()

	// 	}, mongoConnection)


	// }else{

	// 	//we don't need to check the items, we know where it is from

	// 	var isResearch = util.isResearchLocation(allCodes,locations)
	// 	if (isResearch === 'false'){
	// 		isResearch = false
	// 	}else if (isResearch === 'true'){
	// 		isResearch = true
	// 	}else if (isResearch === 'maybe'){
	// 		isResearch = util.isResearchBib(bib)
	// 	}

	// 	var updateRecord  = {
	// 		id : bib.id,
	// 		"sc:research" : isResearch
	// 	}


	// 	var update = true

	// 	if (typeof bib['sc:research'] == 'boolean'){
	// 		if (bib['sc:research'] == isResearch) update = false
	// 	}



	// 	if (update){
	// 		db.updateBibRecord(updateRecord,function(err,r){


	// 			if (err) console.log("ERRROR:",err)

	// 			cursor.resume()


	// 		}, mongoConnection)

	// 	}else{
	// 		cursor.resume()
	// 	}



	// }

})



