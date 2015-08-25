var file = require("../lib/file.js")
var readable = require('stream').Readable
var fs = require("fs")
var db = require("../lib/db.js")



var fileIn = __dirname + '/../data/lccrange_triples.json'
var fileOut = __dirname + '/../data/ranges_enriched.json'



var rs = new readable({objectMode: true})
var outfile = fs.createWriteStream(fileOut)
rs._read = function () {}
rs.pipe(outfile)


var counter= 0



var findMostPopular = function(valObj){

	//test if they are all the same

 	var compare = false;
 	var allSame = true

	for (var x in valObj){

		if (!compare){ compare = valObj[x]; continue;}

		if (compare !== valObj[x]) allSame = false;



	}


	if (allSame && Object.keys(valObj).length != 1) return false

	var largestVal = 0, largest = false
	//find teh largest
	for (var x in valObj){

		if (valObj[x] > largestVal){
			largestVal = valObj[x]
			largest = x
		}


	}

	
	return largest



}


var done = []


file.streamFile(fileIn,function(record,resume){


	if (!record) return false;

	counter++
	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + " | ")



	if (done.indexOf(record.objectUri) === -1 && record.objectUri.search(/[0-9]/) > -1 && record.objectUri.search(/[0-9]\-/) === -1 && record.objectUri.search(/\*/) == -1 && record.subject.search('class')>-1 && record.objectUri.search('class')>-1 && record.predicate === 'skos:mappingRelation' && record.subject.search('fixed') == -1){


		done.push(record.objectUri)
		var usageCount = 0;

		var lcc ={}, dcc = {}, classmark = {}

		
		var searchFor = record.objectUri.replace("class:",'').toUpperCase().replace("1-10000",'');

		console.log(searchFor)

		db.countLccCoarse(searchFor, function(err,count,mongoConnection){

			if (err) console.log(err)
			console.log(count)


			rs.push(JSON.stringify({
				subject : record.objectUri,
				predicate : 'library:holdingsCount',
				objectUri : null,
				objectLiteral : count,
				literalDataType : "xml:integer",
				provenance : JSON.stringify({"@context": "http://www.w3.org/2004/02/skos/core#","@graph": [{"@id": "_:b0","changeNote": "2015-08-23:Created:Billi"}]})
			}) + "\n")
			


			resume()




		});




	}else{
		

		resume()



	}



	//rs.push(JSON.stringify(update) + "\n")

	//


	//})




})




