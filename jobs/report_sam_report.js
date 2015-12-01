#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0

    var materialTypes = {

      "p": "archivalMix"   ,
      "u": "audioBook"     ,
      "a": "bookText"      ,
      "m": "computerFile"  ,
      "v": "dvd"           ,
      "n": "eAudioBook"    ,
      "z": "eBook"         ,
      "q": "eMusic"        ,
      "3": "eVideo"        ,
      "g": "filmSlidesEtc" ,
      "x": "game"          ,
      "o": "kit"           ,
      "l": "largePrint"    ,
      "t": "manuscript"    ,
      "d": "manuscriptMus" ,
      "e": "map"           ,
      "h": "microForm"     ,
      "-": "misc"          ,
      "y": "musicCd"       ,
      "j": "musicNonCd"    ,
      "k": "picture"       ,
      "c": "score"         ,
      "i": "spokenWord"    ,
      "s": "vhs"           ,
      "w": "webResource"   ,
      "r": "3dObject"      ,
      "8": "teacherSet"    ,
      "b": "blueRay"
    }

    var bibLevels = {
      "7": "archives"    ,
      "m": "monograph"   ,
      "s": "serial"      ,
      "-": "-"           ,
      "b": "serCompPt"   ,
      "c": "collection"  ,
      "a": "monoCompPt"  ,
      "d": "subunit"     ,
      "i": "intgrtngRes" 
    }


var report = {}

db.allBibsReverse(function(bib,cursor,mongoConnection){



	if (!bib){


		console.log("DONE!")
		console.log(report)
		console.log("\n")


	}

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + "" )

	counter++

	//console.log(bib)

	if (bib['sc:research']){

		if (bib.bibLevel && bib.materialType){

			if (bib.bibLevel.code && bib.materialType.code){

				if (bibLevels[bib.bibLevel.code.trim()]){
					var b = bibLevels[bib.bibLevel.code.trim()]
				}
				if (materialTypes[bib.materialType.code.trim()]){
					var m = materialTypes[bib.materialType.code.trim()]
				}
			}


			if (b && m){


				if (!report[b]){
					report[b] = {}
				}
				if (!report[b][m]){
					report[b][m] = {bibCount: 0, itemCount:0}
				}

				bib.varFields.forEach(function(v){
					console.log(v)
					if (v.marcTag==='856'){
						console.log(v)
					}

				})








				db.returnItemByBibIds(bib.id,function(err,items){

					report[b][m].bibCount++
					report[b][m].itemCount=report[b][m].itemCount + items.length
					cursor.resume()
					return
				})


			}else{
				console.log("Error:",bib.bibLevel ,bib.materialType)
				cursor.resume()
				return
			}




		}


	}

	



	// 	if (bib.bibLevel.code.trim() == 'm' || bib.bibLevel.code.trim() == 's'){


	// 		if (bib.materialType.code.trim() == 'a' || bib.materialType.code.trim() == 'c'){

	// 			if (!bib.publishYear) bib.publishYear = 0
	// 			if (bib['sc:publishYear']) bib.publishYear = bib['sc:publishYear']


	// 			if (bib.publishYear.toString().length == 4){

	// 				if (parseInt(bib.publishYear) < 1923){



	// 					var allCodes = []
	// 					var bibLocCode = 'multi'
	// 					if (bib.fixedFields['26']){
	// 						if (bib.fixedFields['26'].value){
	// 							bibLocCode = bib.fixedFields['26'].value
	// 						}else{
	// 							bibLocCode = 'multi'
	// 						}
	// 					}

	// 					if (bibLocCode != 'multi'){
	// 						bibLocCode = bibLocCode.trim().toLowerCase()
	// 						allCodes.push(bibLocCode)
	// 					}


	// 					//if the code it multi then we don't know if this is a research item or not
	// 					//we need to ask for the item records and compare that code
	// 					if (allCodes.length == 0){

	// 						//see if it has a item to get the locations
	// 						db.returnItemByBibIds(bib.id,function(err,items){

									
	// 							if (items.length > 0){


	// 								for (var x in items){
	// 									var code = items[x].location.code.trim().toLowerCase()
	// 									allCodes.push(code)							
	// 								}	
	// 							}

	// 							var inLocs = false

	// 							for (var code in allCodes){
	// 								code = allCodes[code]
	// 								if (locs.indexOf(code)>-1) inLocs = true				
	// 							}

	// 							if (inLocs) will_send.info(bib.id)					
								
	// 							cursor.resume()

	// 						}, mongoConnection)


	// 					}else{

	// 						//we don't need to check the items, we know where it is from
	// 						if (locs.indexOf(bibLocCode) > -1){
	// 							will_send.info(bib.id)
	// 						}

							
	// 						cursor.resume()
	// 					}

	// 				}else{ cursor.resume() }


	// 			}else{ 

	// 				will_send_date_error.info(bib.id)

	// 				cursor.resume() 
	// 			}


	// 		}else{ cursor.resume() }



	// 	}else{ cursor.resume() }



	// }else{ cursor.resume() }







})


