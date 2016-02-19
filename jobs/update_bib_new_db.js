#!/usr/local/bin/node


var config = require("config")
var db = require("../lib/db.js")
var fs = require('fs')
var glob = require('glob')
var util = require("../lib/util.js")

var opts = {
    logDirectory: __dirname + '/../log',
    fileNamePattern: 'log-<date>.log',
    dateFormat:'YYYY.MM.DD'
};

var log = require('simple-node-logger').createRollingFileLogger( opts );

log.info('[update_bib_db] Starting up Bib DB script')

util.checkIfRunning(function(isRunning){
	if (isRunning){
      	console.log("Already running ")
		log.info('[update_bib_db] Already running')
      	process.exit()
	}
})

var records = []
var sourceFiles = []


var updateBibRecord = function(){

	if (!records[0]) {

		//drop the old files
		for (var x in sourceFiles){

			
			log.info('[update_bib_db] Deleting: ', sourceFiles[x])
			fs.unlinkSync(sourceFiles[x]);

		}


		util.exit()
		return
	}

	var bib = records.shift()
	

	db.updateBibRecord(bib, function(err,result){


		bib['_id'] = bib.id


		if (err){

			log.info('[update_bib_db] Error updating record', bib)
			log.info(err)
			console.log(err)

		}else{

			console.log(result.result)
			if (result.result.n == 0){

				//the record was not found, so we need to insert it
				
				db.insertBibRecord(bib, function(err,result){

					if (err){
						log.info('[update_bib_db] Error inserting record', bib)
						log.info(err)

						console.log(err)
					}else{
						console.log("inserted ",bib.id,result.result)
					}

					updateBibRecord()
				})


			}else{

				console.log("update",bib.id,result.result)
				updateBibRecord()

			}

		}

	})


}




log.info("[update_item_db] Looking for item records in: ", __dirname + '/../data/bib_*.json')

glob(__dirname + '/../data/bib_*.json', {}, function (er, files) {

	sourceFiles = files

	log.info("[update_bib_db] Going to update records in ", files.length, " files.")


	console.log("Going to update records in ", files.length, " files.")

	//wait for any pending writes to complete from the download script
	setTimeout(function(){


		for (var file in files){

			file = files[file]

			var content = fs.readFileSync(file);

			try{
				content = JSON.parse(content)
				if (content.entries){
					log.info("[update_bib_db] Parsing: ", file)
					for (var x in content.entries){
						records.push(content.entries[x])
					}
				}else{
					log.info("[update_bib_db] Error parsing: ", file)
				}

			}catch (e) {
				log.info("[update_bib_db] Error parsing JSON: ", file)
			}




		}


		log.info("[update_bib_db] Will update/insert ", records.length, " records.")

		//start the first one
		updateBibRecord()


	},5000)





})






