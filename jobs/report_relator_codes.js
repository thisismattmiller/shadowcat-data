#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")
var fs = require("fs")
var counter = 0
var codes = {}

setInterval(function(){



	fs.writeFile(__dirname + '/../log/realtor_codes.json', JSON.stringify(codes,null,4), function (err) {

		if (err) console.log(err)
		console.log(codes)

	})

},30000)

db.allBibsOneField("sc:agents",function(bib,cursor,mongoConnection){

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + " | ")

	counter++

	if (!bib) console.log("DONE!", counter,codes)

	if (bib['sc:agents']){
		for (var x in bib['sc:agents']){
			if (bib['sc:agents'][x].relator){
				if (codes[bib['sc:agents'][x].relator]){
					codes[bib['sc:agents'][x].relator]++
				}else{
					codes[bib['sc:agents'][x].relator] = 1
				}
			}
		}

	}

	

	cursor.resume()


})


