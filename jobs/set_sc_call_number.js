#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")
var _ = require('lodash')

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

// regex looks for classmarks starting with *
// which (hopefully) encompasses everything in LPA
var callnumberRegex = /\*[A-Z0-9\-\s]+/

//just the classmark part
var classmarkOnlyRegex = /\*[A-Z]+/



// sometimes items are only listed in the 590 field
// (see http://catalog.nypl.org/record=b12117171 )
// this pulls them out by looking for a classmark regex
// I think this only applies to LPA stuff...but we'll see
var extract590 = function(obj)
{
	var results = []

	if(obj.marcTag)
	{
		if(obj.marcTag == 590)
		{
			if(obj.subfields)
			{
				for(var x in obj.subfields)
				{
					var content = obj.subfields[x].content
					results.push(content.match(callnumberRegex)[0])
				}
			}
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



	if (!bib){

		console.log("Finished!")
		return true

	}

	var f852 = flatten(bib.varFields.map(extract852))
	var f590 = flatten(bib.varFields.map(extract590))

	var results = _.union(f852, f590)

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

		var classmarks = bib["sc:classmark"]
		if (!classmarks) classmarks = []


		f590.forEach(function(cm){
			cm = cm.match(classmarkOnlyRegex)[0]
			if (cm){
				cm = cm.toLowerCase()
				if (classmarks.indexOf(cm)==-1) classmarks.push(cm)
			}
		})

		if (finalCalls.length==0) finalCalls = false
			var updateRecord  = {
				id : bib.id,
				"sc:callnumber" : finalCalls,
				"sc:classmark" : classmarks
			}

			db.updateBibRecord(updateRecord,function(err,r){

				if (err) console.log("ERRROR:",err)
				// console.log(updateRecord)
				// console.log(r.result)
				cursor.resume()

			}, mongoConnection)


	}, mongoConnection)


})


