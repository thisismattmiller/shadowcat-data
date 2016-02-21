#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")
var _ = require('highland')
var fs = require("fs")
var s3 = require('s3')
var async = require("async")


var client = s3.createClient({
	maxAsyncS3: 20,     // this is the default
	s3RetryCount: 3,    // this is the default
	s3RetryDelay: 1000, // this is the default
	multipartUploadThreshold: 20971520, // this is the default (20 MB)
	multipartUploadSize: 15728640, // this is the default (15 MB)
	s3Options: {
		accessKeyId: process.env.AWSKEY,
		secretAccessKey: process.env.AWSSECRET,
		region: "us-east-1"
	}
})

var totalUploaded = 0

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

var coverLocation = "/Volumes/Backups/bookcovers/covers/"


db.returnCollection("bib",function(err,bibCollection){

	var uploadAndUpdate = _.wrapCallback(function uploadAndUpdate(results,cb){
		if (results){

			console.log(results)

			async.each(results._id, function(bib, callback) {


				//try to upload the image, if that works then update the record in shadowcat
				var filename = coverLocation + results.cover + "-L.jpg"
				var params = {
					localFile: filename,
					s3Params: {
						Bucket: "data.nypl.org",
						Key: "bookcovers/"+bib._id+"_ol.jpg"
					}
				}
				var uploader = client.uploadFile(params)
				uploader.on('error', function(err) {
					//console.error("unable to upload:", err.stack);
					console.log("unable to upload:")
					console.log(err.stack)
					console.log(filename)
					callback()
				})
				uploader.on('end', function() {
					totalUploaded++

					//update shadowcat
					bibCollection.update({ _id: bib._id }, {$set: {  'ol:cover' : true, 'ol:id' : results.olId  } }, function(err, result) {  
						callback()
					})											
				})

			}, function(err){
				//console.log(results)
				cb(null,true)
			})
		}else{
			cb(null,false)
		}


	})


	var findShadowcatMatch = _.wrapCallback(function findShadowcatMatch(cover,cb){
		if (!cover.oclc && !cover.isbn){
			cb(null,false)
			return false
		}
		var searchObj = { "sc:isbn" : cover.isbn }
		if (cover.oclc) searchObj = { $or: [ { "sc:oclc" : cover.oclc }, { "classify:oclc" : cover.oclc } ] }

		bibCollection.find(searchObj, { _id : 1 }).toArray(function(err, results){
			if (results.length>0){
				cb(null, { _id: results, cover: cover.cover, olId: cover.olId  })
			}else{
				cb(null,false)
			}	
		})
	})

	_(fs.createReadStream('./data/ol_dump_coverids.txt'))
		.split()
		.compact()
		.map(function (x) {
			var split = x.split("\t")
			//the isbn has leading zeros
			split[1] = split[1].trim()
			//the bookcover id shoud be padded to 10 digest, that is how the file names are store
			split[3] = pad(parseInt(split[3].trim()),10)
			//open library id
			split[2] = split[2].trim()

			if (split[1] === "" || split[1].length < 6) return {}
			if (split[0]==='oclc') return { oclc: parseInt(split[1]), cover: split[3], olId: split[2] }
			if (split[0]==='isbn') return { isbn: split[1], cover: split[3], olId: split[2] }	
			return {}		
		})
		.map(findShadowcatMatch).sequence()
		.map(uploadAndUpdate).sequence()

		// .batch(1000)
		// .map(_.curry(index))
		// .nfcall([])
		// .series()
		.done(function() {
			console.log("Done")
		})



})




// var opts = {
//     logDirectory: __dirname + '/../log',
//     fileNamePattern: 'log-<date>.log',
//     dateFormat:'YYYY.MM.DD'
// };

// var log = require('simple-node-logger').createRollingFileLogger( opts );

// log.info('[update_sc_identifiers] Starting up script')


// var counter = 0, counterRecords = 0
// var counterOclc = 0, counterIsbn = 0, counterIssn = 0


// //update the log every 15min

// setInterval(function(){
// 	log.info('[update_sc_identifiers] Seeked: ', counter, ' Modified ', counterRecords , ' records. OCLC:',counterOclc," ISBN: ",counterIsbn, " ISSN: ", counterIssn)
// },300000)
	



// db.allBibs(function(bib,cursor,mongoConnection){

// 	counter++


// 	// if (counter > 500000){
// 	// 	mongoConnection.close()
// 	// }


// 	if (!cursor){
// 		log.info('[update_sc_identifiers] Modified ', counterRecords , ' records. OCLC:',counterOclc," ISBN: ",counterIsbn, " ISSN: ", counterIssn)
// 		util.exit()
// 	}


// 	var results = util.extractScIdentifiers(bib)



// 	var updateRecord = { id : bib.id }


// 	//do we have any oclc?
// 	if (results.oclc.length>0){

// 		if (!bib['classify:oclc']){

// 			if (!bib['sc:oclc']){
// 				updateRecord['sc:oclc'] = results.oclc
// 			}else{
// 				if (bib['sc:oclc'].length === 0) updateRecord['sc:oclc'] = results.oclc
// 			}

// 		}
// 	}

// 	//always update the isbn becuase we fucked it up before and turned them into ints.
// 	if (results.isbn.length>0){
// 		updateRecord['sc:isbn'] = results.isbn
// 	}

// 	if (results.issn.length>0){
// 		if (!bib['sc:issn']){
// 			updateRecord['sc:issn'] = results.issn
// 		}else{
// 			if (bib['sc:issn'].length === 0) updateRecord['sc:issn'] = results.issn
// 		}
// 	}

// 	if (updateRecord['sc:oclc'] || updateRecord['sc:isbn'] || updateRecord['sc:issn']){
// 		counterRecords++
// 		if (updateRecord['sc:oclc']) counterOclc++
// 		if (updateRecord['sc:isbn']) counterIsbn++
// 		if (updateRecord['sc:issn']) counterIssn++

// 		db.updateBibRecord(updateRecord,function(err,r){

// 			if (err) console.log("ERRROR:",err)

// 			cursor.resume()

// 		}, mongoConnection)

// 	}else{

// 		cursor.resume()


// 	}
	

// })



