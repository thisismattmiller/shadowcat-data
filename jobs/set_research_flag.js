#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0

var log = require('simple-node-logger').createSimpleLogger(__dirname + '/../log/unknown_location_codes.log');
unknownCodes = []

//some early messed up records that should go into the research pile
var knownResearch = [10052930,10232766,10235367,10235369,10259083,10259142,10259175,10267783,10270410,10460923,10525220,10588514,10626517,10830908,10831545,10832623,10834323,10916184,10919971,10920042,10988999,10990653,10990842,10991285,10992493,10992599,10993442,11028142,11051652,11071489,11071810,11072029,11072066,11072260,11072331,11072346,11072347,11072559,11073043,11073165,11073226,11073260,11073640,11074084,11074300,11074301,11074534,11074698,11074720,11074782,11074833,11074878,11075316,11075397,11075402,11075578,11075579,11075672,11075733,11075878,11075887,11075899,11075993,11076060,11076158,11076223,11076237,11076248,11076495,11076708,11076732,11077196,11077231,11077530,11077531,11077737,11077792,11077861,11077927,11077952,11078246,11078266,11078329,11078590,11078645,11078698,11079185,11079188,11079214,11079262,11079281,11150226,11150545,11150773,11150957,11151027,11151278,11151458,11151643,11151693,11152063,11152448,11152655,11152660,11152865,11153351,11153420,11153490,11153790,11153908,11153911,11153912,11153942,11154160,11154168,11154267,11154482,11154542,11154910,11154936,11155063,11155072,11155101,11155508,11155514,11155629,11155865,11156098,11156463,11156524,11156899,11156923,11156995,11157355,11157590,11157871,11157915,11158800,11159075,11159185,11159189,11159223,11159537,11159547,11159594,11159645,11254365,11255036,11255516,11255548,11255566,11255568,11255583,11255589,11255606,11255949,11256078,11256180,11256261,11256429,11256507,11256691,11256722,11256794,11256897,11256927,11256984,11256985,11257000,11257046,11257165,11257170,11258672,11258725,11259034,11259733,11259916,11260089,11300962,11322488,11322510,11322526,11322672,11322743,11322850,11323127,11323245,11323307,11323650,11323663,11323825,11324081,11324257,11324275,11324582,11324713,11324877,11324900,11325024,11325172,11325298,11325399,11325470,11325523,11325776,11325827,11326408,11326920,11327138,11327203,11327769,11336630,11336876,11337155,11337783,11337905,11337984,11338163,11338289,11338405,11338435,11338437,11338583,11338675,11338821,11339053,11339183,11339223,11339340,11339696,11340668,11341161,11341546,11341795,11341828,11341855,11342309,11342478,11343237,11343578,11343666,11398147,11408498,11408561,11408654,11408719,11408822,11408904,11409385,11409424,11409592,11440679,11440705,11440938,11441426,11441572,11441687,11442002,11442172,11443022,11443647,11443968,11444023,11483381,11541827,11622764,11632967,11637753,11654028,11709270,11712950,11754850,11825687,11826254,11826590,11830723,11846377,11849285,11853667,11871160,11901606,11905817,11924081,11924379,12015010,12037163,12042913,12102556,12115513,12115720,12116313,12116411,12116459,12184834,12186150,12193151,12194733,12207353,12260186,12296455,12465912,12589954,12592815,12751495,12756765,12885419,13010112,13036947,13058024,13058025,13058026,13058027,13058028,13058030,13058031,13058032,13058034,13058035,13058036,13058037,13058038,13058039,13058040,13058041,13058042,13058043,13058044,13091241,13091246,13091256,13091274,13091282,13091313,13091439,13091697,13091709,13281869,13444033,13449122,13542213,13615242,13655987,13676934,13683131,13713009,13726760,13816072,13821266,13821330,13936628,13945423,14023298,14051643,14069467,14099490,14101748,14102802,14114702,14133271,14146329,14150239,14153408,14177681,14195825,14196154,14196155,14196476,14196477,14196645,14198554,14198556,14198559,14199142,14247329,14247330,14247331,14247332,14255770,14256794,14257294,14257297,14261810,14262084,14262721,14262725,14262729,14324007]

util.parseLocationFile(function(locations){

	db.allBibs(function(bib,cursor,mongoConnection){

		process.stdout.clearLine()
		process.stdout.cursorTo(0)
		process.stdout.write( counter + "" )

		counter++

		var allCodes = []
		var bibLocCode = 'multi'
		if (bib.fixedFields['26']){
			if (bib.fixedFields['26'].value){
				bibLocCode = bib.fixedFields['26'].value
			}else{
				bibLocCode = 'multi'
			}
		}

		//set it to SASB if it is one of our known problem records
		if (knownResearch.indexOf(bib.id)) bibLocCode = 'ma'



		if (bibLocCode != 'multi'){
	

			bibLocCode = bibLocCode.trim().toLowerCase()

			if (bibLocCode != ''){
				if (!locations[bibLocCode]){
					if (unknownCodes.indexOf(bibLocCode) == -1){
						unknownCodes.push(code)
						console.log("No location known for this:",bibLocCode)
						log.info(bib.fixedFields['26'], bib.id)
						bibLocCode = 'multi'
					}
				}else{
					//this is our code, we know it exists 
					allCodes = [bibLocCode]
				}
			}			

		}


		//if the code it multi then we don't know if this is a research item or not
		//we need to ask for the item records and compare that code
		if (allCodes.length == 0){

			//see if it has a item to get the locations
			db.returnItemByBibIds(bib.id,function(err,items){

					
				if (items.length > 0){


					for (var x in items){
						var code = items[x].location.code.trim().toLowerCase()
						if (locations[code]){
							allCodes.push(code)
						}else{
							console.log("No location known for this:",items[x].location)
							if (unknownCodes.indexOf(code) == -1){
								unknownCodes.push(code)
								log.info(items[x].location)
							}								
						}						
					}	
				}



				var isResearch = util.isResearchLocation(allCodes,locations)

				if (isResearch === 'false'){
					isResearch = false
				}else if (isResearch === 'true'){
					isResearch = true
				}else if (isResearch === 'maybe'){
					isResearch = util.isResearchBib(bib)
				}

				var updateRecord  = {
					id : bib.id,
					"sc:research" : isResearch
				}

				db.updateBibRecord(updateRecord,function(err,r){

					if (err) console.log("ERRROR:",err)

					console.log(updateRecord)
					console.log(r.result)
					cursor.resume()

				}, mongoConnection)

				
				
				

			}, mongoConnection)


		}else{

			//we don't need to check the items, we know where it is from

			var isResearch = util.isResearchLocation(allCodes,locations)
			if (isResearch === 'false'){
				isResearch = false
			}else if (isResearch === 'true'){
				isResearch = true
			}else if (isResearch === 'maybe'){
				isResearch = util.isResearchBib(bib)
			}


			var updateRecord  = {
				id : bib.id,
				"sc:research" : isResearch
			}

			db.updateBibRecord(updateRecord,function(err,r){


				if (err) console.log("ERRROR:",err)

				console.log(updateRecord)
				console.log(r.result)

				cursor.resume()


			}, mongoConnection)



		}

		


		





	})




})
