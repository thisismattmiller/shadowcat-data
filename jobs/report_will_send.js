#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0

var will_send = require('simple-node-logger').createSimpleLogger(__dirname + '/../log/will_send.log')
var will_send_date_error = require('simple-node-logger').createSimpleLogger(__dirname + '/../log/will_send_date_error.log')

var locs = ['mab', 'maf', 'mag', 'mal', 'map', 'mas', 'mau', 'myd', 'mym', 'myt', 'scf', 'slr']

db.allBibs(function(bib,cursor,mongoConnection){

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + "" )

	counter++




	if (bib.bibLevel && bib.materialType){


		if (bib.bibLevel.code.trim() == 'm' || bib.bibLevel.code.trim() == 's'){


			if (bib.materialType.code.trim() == 'a' || bib.materialType.code.trim() == 'c'){

				if (!bib.publishYear) bib.publishYear = 0
				if (bib['sc:publishYear']) bib.publishYear = bib['sc:publishYear']


				if (bib.publishYear.toString().length == 4){

					if (parseInt(bib.publishYear) < 1923){



						var allCodes = []
						var bibLocCode = 'multi'
						if (bib.fixedFields['26']){
							if (bib.fixedFields['26'].value){
								bibLocCode = bib.fixedFields['26'].value
							}else{
								bibLocCode = 'multi'
							}
						}

						if (bibLocCode != 'multi'){
							bibLocCode = bibLocCode.trim().toLowerCase()
							allCodes.push(bibLocCode)
						}


						//if the code it multi then we don't know if this is a research item or not
						//we need to ask for the item records and compare that code
						if (allCodes.length == 0){

							//see if it has a item to get the locations
							db.returnItemByBibIds(bib.id,function(err,items){

									
								if (items.length > 0){


									for (var x in items){
										var code = items[x].location.code.trim().toLowerCase()
										allCodes.push(code)							
									}	
								}

								var inLocs = false

								for (var code in allCodes){
									code = allCodes[code]
									if (locs.indexOf(code)>-1) inLocs = true				
								}

								if (inLocs) will_send.info(bib.id)					
								
								cursor.resume()

							}, mongoConnection)


						}else{

							//we don't need to check the items, we know where it is from
							if (locs.indexOf(bibLocCode) > -1){
								will_send.info(bib.id)
							}

							
							cursor.resume()
						}

					}else{ cursor.resume() }


				}else{ 

					will_send_date_error.info(bib.id)

					cursor.resume() 
				}


			}else{ cursor.resume() }



		}else{ cursor.resume() }



	}else{ cursor.resume() }







})


