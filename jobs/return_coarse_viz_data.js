#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")
var async = require("async")

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

	searchArray.shift()

	var lookup = function(){

		console.log(searchArray[0])
		db.returnBibByCoarseLCC(searchArray[0],function(err,docs,mongoConnection){

			if (err) console.log("ERR:",err)

			searchArray.shift()

			console.log(docs.length)

			var bibIds = []
			var docObj = {}
			for (var x in docs){
				bibIds.push(docs[x].id)
				docObj[docs[x].id] = docs[x]
			}

			//console.log(bibIds)
			console.log("NEXT ->",searchArray.length)

			//db.returnItemByBibIds()

			//loop through all the bibids an find their item count and update the doc
			async.mapSeries(bibIds, function(id,cb){

				console.log("in hurrr",id)

				db.returnItemByBibIds(id,function(err,doc){

					if (doc[0]){

						console.log("\t",doc[0].id)
					}
					
					cb(null,id)


				})

				


			},function(err, results){

				if (err) console.log(err)

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
