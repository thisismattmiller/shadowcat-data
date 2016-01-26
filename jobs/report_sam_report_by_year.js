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



setInterval(function(){


	fs.writeFile("log/sam_report_by_year_interval.json",JSON.stringify(report,null,4)+"\n", function (err) {

		console.log(JSON.stringify(report))


	})


},10000)

db.allBibs(function(bib,cursor,mongoConnection){



	if (!bib){


		console.log("DONE!")
		console.log("\n")


		fs.writeFile("log/sam_report_by_year.json",JSON.stringify(report,null,4)+"\n", function (err) {
			console.log(report)
		})
		return true


	}

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + "" )

	counter++

	//console.log(JSON.stringify(report,null,4))


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
				report[b][m] = {}
			}

			
			var year = bib.publishYear
			if (bib['sc:publishYear']) year = bib['sc:publishYear']
			

			var year = parseInt(year)

			if (!isNaN(year)){


				if (!report[b][m][year]){
					report[b][m][year] = {bibCount: 0, itemCount:0}
				}				


				db.returnItemCount(bib.id,function(err,count){

					report[b][m][year].bibCount++
					report[b][m][year].itemCount=report[b][m][year].itemCount + count
					cursor.resume()
					return

				},mongoConnection)


			}else{
				console.log("Error:",bib.bibLevel ,bib.materialType,year)
				cursor.resume()

			}





		}else{
			console.log("Error:",bib.bibLevel ,bib.materialType)
			cursor.resume()
			return
		}




	}





})


