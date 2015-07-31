#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0

var log = require('simple-node-logger').createSimpleLogger(__dirname + '/../log/unknown_location_codes.log');
unknownCodes = []

util.parseLocationFile(function(locations){


	db.allBibs(function(bib,cursor,mongoConnection){

		process.stdout.clearLine()
		process.stdout.cursorTo(0)
		process.stdout.write( counter + "" )

		counter++



		//see if it has a item to get the locations
		db.returnItemByBibIds(bib.id,function(err,items){

				
			if (items.length > 0){


				for (var x in items){

					var code = items[x].location.code.trim().toLowerCase()

					if (locations[code]){


					}else{

						console.log("No location known for this:",items[x].location)

						if (unknownCodes.indexOf(code) == -1){
							unknownCodes.push(code)
							log.info(items[x].location)
						}
							
					}
					
				}
				



			}else{

				//console.log("No item record:",bib.id)


			}

			
			cursor.resume()

		}, mongoConnection)
		





	})




})
