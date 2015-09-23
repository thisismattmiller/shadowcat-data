#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0


var extract852 = function(obj){

	var results = []

	if (obj.marcTag){
		if (obj.marcTag === '852'){

			var subfields = {
				h: false,
				i: false,
				k: false,
				m: false,
				a: false,
				g: false,
				v: false
			}
			/*
			$h - Classification part (NR)  x
			$i - Item part (R) 
			$k - Call number prefix (R)  x

			$m - Call number suffix (R)  x
			*/

			if (obj.subfields){

				for (var x in obj.subfields){
					if (obj.subfields[x].tag === 'h') subfields.h = obj.subfields[x].content
					if (obj.subfields[x].tag === 'i') subfields.i = obj.subfields[x].content
					if (obj.subfields[x].tag === 'k') subfields.k = obj.subfields[x].content
					if (obj.subfields[x].tag === 'm') subfields.m = obj.subfields[x].content
					if (obj.subfields[x].tag === 'a') subfields.a = obj.subfields[x].content
					if (obj.subfields[x].tag === 'g') subfields.g = obj.subfields[x].content
					if (obj.subfields[x].tag === 'v') subfields.v = obj.subfields[x].content

				}

				var c = false

				//it has a classification part
				if (subfields.h){
					var c = subfields.h
				}else{
					if (subfields.a) c = subfields.a
					if (subfields.g) c = subfields.g
				}


				//add in any prefixes
				if (subfields.k) c = subfields.k + " " + c

				//add in any suffix
				if (subfields.m) c = c + " " + subfields.m

				//add in any suffix
				if (subfields.v) c = c + " " + subfields.v


				if (c){
					results.push(c)
					//ad it in again with the item part to index on both
					//if (subfields.i) results.push(c + " " + subfields.i)
				}



			


			}

			//if (results.length == 0) console.log(obj)


		}
	}

	
	return results
	
}


//some early messed up records that should go into the research pile

var flatten = function(results){
	var r = []

	for (var x in results){

		for (var y in results[x]){
			r.push(results[x][y])
		}

	}

	return r
}


db.allBibs(function(bib,cursor,mongoConnection){

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + "" )

	counter++

	var results = flatten(bib.varFields.map(extract852))

	//console.log(results)
	//get the same info for each item

	db.returnItemByBibIds(bib.id,function(err,items){
			
		if (items.length > 0){
			for (var x in items){
				results = results.concat(flatten(items[x].varFields.map(extract852)))
			}		
		}



		var finalCalls = []

		for (var x in results){

			//lowercase remove periods
			var c = results[x].toLowerCase().replace(/\./g,'')

			if (finalCalls.indexOf(c) == -1){
				finalCalls.push(c)
			}


		}
		

		if (finalCalls.length==0) finalCalls = false


			var updateRecord  = {
				id : bib.id,
				"sc:callnumber" : finalCalls
			}

			db.updateBibRecord(updateRecord,function(err,r){

				if (err) console.log("ERRROR:",err)

				console.log(updateRecord)
				console.log(r.result)
				cursor.resume()

			}, mongoConnection)


	}, mongoConnection)


})


