#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")
var _ = require('highland')
var fs = require("fs")
var async = require("async")

var totalAdded = 0, total = 0

var splitIt = function(val){
	var r = null
	if (val.search(",")>-1){
		r = val.trim().split(",")
	}else if (val.search(";")>-1){
		r = val.trim().split(";")
	}else{
		r = [val.trim()]
	}
	var finalR = []
	for (var x in r){
		if (r[x]!='') finalR.push(r[x])
	}
	return finalR
}


db.returnCollection("bib",function(err,bibCollection){
	var updateShadowcat = _.wrapCallback(function updateShadowcat(vol,cb){	
		//try all the fields
		async.parallel({
			//mark this, the bnumber if there is one and the MMS collection as being serialized
			byScOclc: function(callback){
				if (vol.oclc.length==0){
					callback(err, [])
					return false
				}
				var searchObj = vol.oclc.map(x => {  return {"sc:oclc" : x }}  )			
				bibCollection.find({ $or: searchObj }, { _id: 1, "hathi:vols" : 1 }).toArray(function(err, results){
					callback(err, results)
				})
			},
			byClassifyOclc: function(callback){
				if (vol.oclc.length==0){
					callback(err, [])
					return false
				}
				var searchObj = vol.oclc.map(x => {  return {"classify:oclc" : x }}  )			
				bibCollection.find({ $or: searchObj }, { _id: 1, "hathi:vols" : 1 }).toArray(function(err, results){
					callback(err, results)
				})
			},
			byIssn: function(callback){
				if (vol.issn.length==0){
					callback(err, [])
					return false
				}				
				var searchObj = vol.issn.map(x => {  return {"sc:issn" : x }}  )			
				bibCollection.find({ $or: searchObj }, { _id: 1, "hathi:vols" : 1 }).toArray(function(err, results){
					callback(err, results)
				})
			},
			byIsbn: function(callback){
				if (vol.isbn.length==0){
					callback(err, [])
					return false
				}				
				var searchObj = vol.isbn.map(x => {  return {"sc:isbn" : x }}  )			
				bibCollection.find({ $or: searchObj }, { _id: 1, "hathi:vols" : 1 }).toArray(function(err, results){
					callback(err, results)
				})
			},

		},
		function(err, results) {


			var useBnumbers = []
			//prioritze by which fields we use
			if (results.byScOclc.length>0){
				useBnumbers = results.byScOclc
			}else if ( results.byIssn.length > 0 ){
				useBnumbers = results.byIssn
			}else if ( results.byIsbn.length > 0 ){
				useBnumbers = results.byIsbn
			}else if ( results.byClassifyOclc.length > 0 ){
				useBnumbers = results.byClassifyOclc
			}else{
				useBnumbers = false
			}
			
			if (useBnumbers!==false){
				//we want to update all the bnumbers supplied with the vol info and hathi flags
				async.each(useBnumbers, function(bib, callback) {
					if (!bib["hathi:vols"]) bib["hathi:vols"] = []
					totalAdded++

					var allVols = bib["hathi:vols"].map(x=> x.volumeId )

					if (allVols.indexOf(vol.volumeId)==-1){
						bib["hathi:vols"].push(vol)					
					}					
					//if any of the vols are access allow then we want to flag that
					bib["hathi:access"] = false
					bib["hathi:vols"].forEach(x =>{
						if (x.access=='allow') bib["hathi:access"] = true
						bib["hathi:id"] = x.hathiId
					})
					//update shadowcat
					bibCollection.update({ _id: bib._id }, {$set: bib }, function(err, result) {  
						callback()
						//console.log("\n",bib._id,"\n")					
					})
				}, function(err){
					cb(null,vol)
				})
			}else{
				cb(null,vol)
			}		
		})
	})

	_(fs.createReadStream('./data/hathi_full.txt'))
		.split()
		.compact()
		.map(function (x) {

			total++

			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			process.stdout.write("Hathi Update: total: " +  total + " | totalAdded: " + totalAdded )


			var data = x.split("\t")

			var mapped = {}
			mapped.volumeId = data[0].trim()
			mapped.access = data[1].trim()
			mapped.rights = data[2].trim()
			mapped.hathiId = data[3].trim()
			mapped.enumeration = data[4].trim()
			//mapped.source = data[5].trim()
			//mapped.sourceId = data[6].trim()

			mapped.oclc = splitIt(data[7].trim())
			mapped.oclc = mapped.oclc.map(x => parseInt(x))

			mapped.isbn = splitIt(data[8].trim())
			mapped.issn = splitIt(data[9].trim())
			mapped.lccn = splitIt(data[10].trim())
			//mapped.title = data[11].trim()

			//lets clean up their isbns and such
			var isbns = []
			for (var x in mapped.isbn){
				x = mapped.isbn[x].replace(/\.|a|z/g,"").replace(/\)|\(|:|;|\-|\/|£|$|\\/g," ").split(" ")
				for (var xx in x){
					xx =x[xx]
					//is it the right length?
					if (xx.length == 10 || xx.length == 13){
						//add it
						isbns.push(xx)
					}
				}
			}
			mapped.isbn = isbns
			//mapped.imprint = data[12].trim()
			//mapped.rightsDetermination = data[13].trim()
			//mapped.update = data[14].trim()
			//mapped.gov = data[15].trim()
			mapped.pubDate = data[16].trim()
			//mapped.pubPlace = data[17].trim()
			mapped.language = data[18].trim()
			mapped.bibFormat = data[19].trim()			
			return mapped		
		})
		.map(updateShadowcat).sequence()
		.done(function() {
			console.log("Done")
		})



})

