#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")
var async = require("async")
var fs = require("fs")

var counter = 0

var usePrefix = 'BF'

util.parseLCC(function(lcc){


	if (lcc[usePrefix]){
		var searchArray = []
		var lookupObj = {}
		for (var classmark in lcc[usePrefix]){
			searchArray.push(lcc[usePrefix][classmark].id)
			lookupObj[lcc[usePrefix][classmark].id] = lcc[usePrefix][classmark]
		}

	}

	var results = {}


	var lookup = function(){

		if (!searchArray[0]) return false

		db.returnBibByCoarseLCC(searchArray[0],function(err,docs,mongoConnection){


			if (err) console.log("ERR:",err)

			


			var records =[]

			var years = []
			for (var x in docs){
				years.push(docs[x].publishYear)
			}

			years = years.sort(function (a, b) {return a - b;})

			var deDupeYears = []
			for (var x in years){
				if (deDupeYears.indexOf(years[x]) === -1) deDupeYears.push(years[x])
			}

			var added = []
			for (var year in deDupeYears){

				year = deDupeYears[year]


				for (var r in docs){

					r = docs[r]

					if (r.publishYear === year){


						if (added.indexOf(r.id)===-1){

							var record = {

								publishYear: (!r.publishYear) ? "undefined" : r.publishYear,
								id : r.id,
								title : r.title,
								author : r.author,
								'classify:holdings' : r['classify:holdings'],
								'sc:usageCount' : (!r['sc:usageCount']) ? -1 : r['sc:usageCount'],
								'classify:creatorVIAF' : r['classify:creatorVIAF']
							}

							records.push(record)

							added.push(r.id)

						}

					}


				}




			}


			//write it out / save it to the DB
			fs.writeFile(__dirname + "/../data/" + searchArray[0] + ".json", JSON.stringify(records), function(err) {
				if(err) console.log(err)


				searchArray.shift()

				if (searchArray.length === 0) mongoConnection.close()
				lookup()




			})





			

		})


	}

	lookup()





	//console.log(lookupObj)

	// db.allBibs(function(bib,cursor,mongoConnection){

	// 	process.stdout.clearLine()
	// 	process.stdout.cursorTo(0)
	// 	process.stdout.write( counter + "" )

	// 	counter++


	// 	if (bib['classify:lcc']){


	// 		var updateRecord  = {
	// 			id : bib.id,
	// 			"sc:lccCoarse" : util.coarseLCC(bib['classify:lcc'],lcc)
	// 		}


	// 		db.updateBibRecord(updateRecord,function(err,r){

	// 			if (err) console.log("ERRROR:",err)

	// 			console.log(updateRecord)
	// 			console.log(r.result)
	// 			cursor.resume()

	// 		}, mongoConnection)


	// 	}else{

	// 		cursor.resume()
			
	// 	}




	// })




})
