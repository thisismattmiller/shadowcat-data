#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")
var fs = require("fs")

var counter = 0


var report = {}

setInterval(function(){
	fs.writeFile("log/report_purl_police.json",JSON.stringify(report,null,4)+"\n", function (err) {})
},10000)

db.allBibs(function(bib,cursor,mongoConnection){

	if (!bib){
		console.log("DONE!")
		console.log("\n")


		fs.writeFile("log/report_purl_police.json",JSON.stringify(report,null,4)+"\n", function (err) {
			console.log(report)
		})
		return true


	}

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + "" )

	counter++

	var bibString = JSON.stringify(bib)

	if (bibString.search(/Treasures of the American Performing Arts/i)>-1){
		if (!report[bib._id]) report[bib._id] = { "856": [], "001": false }
		
		bib.varFields.forEach(function(v){
			if (v.marcTag==='856'){				
				v.subfields.forEach(function(s){
					if (s.tag){
						if (s.tag==='u'){
							var url = s.content
							if (url.search(/purl\.nypl/gi) > -1){								
								report[bib._id]['856'].push(url)
							}
						}
					}
				})
			}
			if (v.marcTag==='001'){
				if (v.content){
					report[bib._id]['001'] = v.content
				}
			}
		})
	}
	cursor.resume()
})


