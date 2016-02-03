#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")
var fs = require("fs")

var counter = 0


var report = {}



setInterval(function(){


	fs.writeFile("log/report_856_interval.json",JSON.stringify(report,null,4)+"\n", function (err) {

		//console.log(JSON.stringify(report))


	})


},10000)

db.allBibs(function(bib,cursor,mongoConnection){



	if (!bib){


		console.log("DONE!")
		console.log("\n")


		fs.writeFile("log/report_856.json",JSON.stringify(report,null,4)+"\n", function (err) {
			console.log(report)
		})
		return true


	}

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + "" )

	counter++

	




	bib.varFields.forEach(function(v){
		if (v.marcTag==='856'){
			
			v.subfields.forEach(function(s){
				if (s.tag){
					if (s.tag==='u'){
						var url = s.content
						if (url.search(/link\.nypl/gi) > -1){
						//if (url.search(/digitalgallery\.nypl/gi)>-1){
							if (!report[bib._id]) report[bib._id] = []
							report[bib._id].push(url)
						}
					}
				}

			})


		}

	})

	cursor.resume()




})


