#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")
var fs = require("fs")

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
var domainReport = {}
var domainReportExamples = {}

var pdReport = {}



setInterval(function(){

	var r = {

		counts: report,
		pd: pdReport,
		domains: domainReport,
		domainReportExamples: domainReportExamples
	}

	
	

	fs.writeFile("log/sam_report.json",JSON.stringify(r,null,4)+"\n", function (err) {

		console.log(JSON.stringify(r))


	})


},10000)

db.allBibs(function(bib,cursor,mongoConnection){



	if (!bib){


		console.log("DONE!")
		console.log("\n")

		var r = {
			counts: report,
			pd: pdReport,
			domains: domainReport,
			domainReportExamples: domainReportExamples
		}
	

		fs.writeFile("log/sam_report.json",JSON.stringify(r,null,4)+"\n", function (err) {
			console.log(r)
		})






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
					if (v.marcTag==='856'){
						
						v.subfields.forEach(function(s){

							if (s.tag){
								if (s.tag==='u'){

									var url = s.content




									var domain = url.replace(/http:\/\//,'')
									domain = domain.replace(/https:\/\//,'')
									domain = domain.replace(/ftp:\/\//,'')
									domain = domain.trim().split('/')



									

									if (domain[0]){


										if (domain[0].search(/search\.serialssolutions\.com/) > -1) domain[0] = "search.serialssolutions.com"

										if (domain[0].search(/\.jpg/) > -1) domain[0] = "JPG Image"

										if (!domainReport[b]){
											domainReport[b] = {}
										}
										if (!domainReport[b][m]){
											domainReport[b][m] = {}
										}

										if (!domainReport[b][m][domain[0]]){
											domainReport[b][m][domain[0]] = 0
										}

										domainReport[b][m][domain[0]]++

										if (!domainReportExamples[b]){
											domainReportExamples[b] = {}
										}
										if (!domainReportExamples[b][m]){
											domainReportExamples[b][m] = {}
										}

										if (!domainReportExamples[b][m][domain[0]]){
											domainReportExamples[b][m][domain[0]] = []
										}

										if (domainReportExamples[b][m][domain[0]].length<6) domainReportExamples[b][m][domain[0]].push("http://catalog.nypl.org/record=b" + bib._id)
										



									}



								}
							}


						})


					}

				})

				var year = bib.publishYear
				if (bib['sc:publishYear']) year = bib['sc:publishYear']
				

				var year = parseInt(year)

				if (!isNaN(year)){

					var pd = 'pre1923'

					if (year>1923) pd = 'post1923'

					if (!pdReport[b]){
						pdReport[b] = {}
					}
					if (!pdReport[b][m]){
						pdReport[b][m] = {}
					}

					if (!pdReport[b][m][pd]){
						pdReport[b][m][pd] = 0
					}					

					pdReport[b][m][pd]++


				}







				db.returnItemCount(bib.id,function(err,count){

					report[b][m].bibCount++
					report[b][m].itemCount=report[b][m].itemCount + count
					cursor.resume()
					return
				},mongoConnection)


			}else{
				console.log("Error:",bib.bibLevel ,bib.materialType)
				cursor.resume()
				return
			}




		}


	}else{
		cursor.resume()
		return

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


