#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0
var totalChanged = 0



db.allBibs(function(bib,cursor,mongoConnection){

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + " | " + totalChanged)

	counter++

	var hasChecked = (bib['sc:classifyCheck']) ? true : false
	


	if (!hasChecked){


			//build out the data we would use in classify
			var data = {
				_id: bib._id,
				oclc : [],
				isbn : [],
				issn : [],
				title : false,
				author : false
			}

			if (bib['sc:oclc']){
				for (var x in bib['sc:oclc']){
					data.oclc.push(bib['sc:oclc'][x])
				}
			}

			if (bib['lc:oclc']){
				for (var x in bib['lc:oclc']){
					data.oclc.push(bib['lc:oclc'][x])
				}
			}
			if (bib['sc:isbn']){
				for (var x in bib['sc:isbn']){
					data.isbn.push(bib['sc:isbn'][x])
				}
			}
			if (bib['sc:issn']){
				for (var x in bib['sc:issn']){
					data.issn.push(bib['sc:issn'][x])
				}
			}

			if (bib['author']){
				data.author = bib['author']
			}
			if (bib['title']){
				data.title = bib['title']
			}

			

			db.insertAPIClassifyRecord(data,function(err,results){

				cursor.resume()

				//console.log(data)
				//if (results) console.log(results.result)

			})

			return true



			

	}
	
	cursor.resume()





})

