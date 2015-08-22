#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0
var totalChanged = 0

//var log = require('simple-node-logger').createSimpleLogger(__dirname + '/../log/coarse_lcc_error.log');


var extract010 = function(obj){

	var results = []

	if (obj.marcTag){
		if (obj.marcTag === '010'){
			if (obj.subfields){
				for (var x in obj.subfields){
					if (obj.subfields[x].tag){
						if (obj.subfields[x].tag.trim().toLowerCase() === 'a'){
							if (obj.subfields[x].content) results.push(obj.subfields[x].content)
						}
					}
				}
			}
		}
	}
	return results
}



db.allBibs(function(bib,cursor,mongoConnection){

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + " | ")

	counter++

	var hasCourseLcc = (bib['sc:lccCoarse']) ? true : false
	


	if (!hasCourseLcc){


			var mapResults = bib.varFields.map(extract010)

			var lccn = []

			for (var x in mapResults){
				for (var y in mapResults[x]){
					if (mapResults[x][y] && lccn.indexOf(mapResults[x][y].trim()) === -1) lccn.push(mapResults[x][y])
				}
			}			

			if (lccn[0]){

				var lccn = lccn[0]


				if (lccn.match(/[0-9]{8}/)){


					//okay drop anything after the /

					lccn = lccn.split('/')
					lccn = lccn[0]
					lccn = lccn.trim()
					lccn = lccn.toLowerCase()
					lccn = lccn.replace(/\s/g,'')

					lccn = lccn.replace('rev.','').replace('rev','')

					if (isNaN(lccn)){

						//we only want the form [a-z][0-9]+

						var m = lccn.match(/[a-z]+[0-9]+/)

						if (m){
							lccn = m[0]
						}else{
							console.log("bad lccn" , lccn[0])
						}


					}

					if (lccn){


						var insert = {

							'_id' : bib.id,
							lccn: lccn

						}


						db.insertAPILccnRecord(insert,function(err,results){

							cursor.resume()
							if (results) console.log(results.result)

						})

						return true
			



						
					}





				}




			}
			

	}
	
	cursor.resume()





})

