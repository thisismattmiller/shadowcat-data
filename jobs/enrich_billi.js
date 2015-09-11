var file = require("../lib/file.js")
var readable = require('stream').Readable
var fs = require("fs")
var db = require("../lib/db.js")



var fileIn = __dirname + '/../data/billings.json'
var fileOut = __dirname + '/../data/billings_enriched.json'



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





file.streamFile(fileIn,function(record,resume){


	if (!record) return false;

	counter++
	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + "")



	if (record.subject.search('class')>-1 && record.predicate === 'skos:hiddenLabel' ){

		var usageCount = 0;

		var lcc ={}, dcc = {}, lccRange = {}

		record.objectLiteral = record.objectLiteral.replace(/\_/gi,' ')

		var searchFor = record.objectLiteral.toLowerCase().replace(/\./,'')

		db.allBibsByClassmark(searchFor, function(bib,cursor,mongoConnection){



			if (!bib){

				var resultsLcc = findMostPopular(lcc), resultsDcc = findMostPopular(dcc), resultsLccRange = findMostPopular(lccRange)

				console.log(record.objectLiteral,usageCount,resultsLcc,resultsDcc,resultsLccRange)

				if (resultsLcc){
					rs.push(JSON.stringify({
						subject : record.subject,
						predicate : 'skos:mappingRelation',
						objectUri : 'lcc:'+resultsLcc,
						objectLiteral : null,
						literalDataType : null,
						provenance : JSON.stringify({"@context": "http://www.w3.org/2004/02/skos/core#","@graph": [{"@id": "_:b0","changeNote": "2015-08-23:Created:Billi"}]})
					}) + "\n")
				}

				if (resultsDcc){
					rs.push(JSON.stringify({
						subject : record.subject,
						predicate : 'skos:mappingRelation',
						objectUri : 'dewey:'+resultsDcc,
						objectLiteral : null,
						literalDataType : null,
						provenance : JSON.stringify({"@context": "http://www.w3.org/2004/02/skos/core#","@graph": [{"@id": "_:b0","changeNote": "2015-08-23:Created:Billi"}]})
					}) + "\n")
				}


				if (resultsLccRange){

					if (resultsLccRange.search(/[0-9]/) ===-1) resultsLccRange = resultsLccRange + '1-10000'

					rs.push(JSON.stringify({
						subject : record.subject,
						predicate : 'skos:mappingRelation',
						objectUri : 'class:'+ resultsLccRange.toLowerCase().replace(/\s/g,'_'),
						objectLiteral : null,
						literalDataType : null,
						provenance : JSON.stringify({"@context": "http://www.w3.org/2004/02/skos/core#","@graph": [{"@id": "_:b0","changeNote": "2015-08-23:Created:Billi"}]})
					}) + "\n")


					//add the inverse from the range to the billings
					rs.push(JSON.stringify({
						subject : 'class:'+ resultsLccRange.toLowerCase().replace(/\s/g,'_'),
						predicate : 'skos:mappingRelation',
						objectUri : record.subject,
						objectLiteral : null,
						literalDataType : null,
						provenance : JSON.stringify({"@context": "http://www.w3.org/2004/02/skos/core#","@graph": [{"@id": "_:b0","changeNote": "2015-08-23:Created:Billi"}]})
					}) + "\n")


				}

				rs.push(JSON.stringify({
					subject : record.subject,
					predicate : 'library:holdingsCount',
					objectUri : null,
					objectLiteral : usageCount,
					literalDataType : "xml:integer",
					provenance : JSON.stringify({"@context": "http://www.w3.org/2004/02/skos/core#","@graph": [{"@id": "_:b0","changeNote": "2015-08-23:Created:Billi"}]})
				}) + "\n")
				


				resume()
				return false;

			}

			if (bib['classify:lcc']){
				if (!lcc[bib['classify:lcc']]) lcc[bib['classify:lcc']] = 0;
				lcc[bib['classify:lcc']]++
			}
			if (bib['classify:dcc']){
				if (!dcc[bib['classify:dcc']]) dcc[bib['classify:dcc']] = 0;
				dcc[bib['classify:dcc']]++
			}
			if (bib['sc:lccCoarse']){
				if (!lccRange[bib['sc:lccCoarse']]) lccRange[bib['sc:lccCoarse']] = 0;
				lccRange[bib['sc:lccCoarse']]++
			}



			

			usageCount++



			cursor.resume()





		});




	}else{
		

		resume()



	}



	//rs.push(JSON.stringify(update) + "\n")

	//


	//})




})




