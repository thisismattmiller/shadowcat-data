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

log.info('[update_item_db] Starting up DB script')


//see if this process is running already
util.checkIfRunning(function(isRunning){
	if (isRunning){
      	console.log("Already running ",stdout.split(__filename).length)
		log.info('[update_item_db] Already running instance count: ', stdout.split(__filename).length )
      	process.exit()
	}
})



var records = []
var sourceFiles = []



var updateItemRecord = function(){

	if (!records[0]) {

		//drop the old files
		for (var x in sourceFiles){

			
			log.info('[update_item_db] Deleting: ', sourceFiles[x])
			fs.unlinkSync(sourceFiles[x]);

		}


		util.exit()
		return
	}

	var item = records.shift()

	item['_id'] = item.id
	item.barcode = parseInt(item.barcode)	

	db.updateItemRecord(item, function(err,result){





		if (err){

			log.info('[update_item_db] Error updating record', item)
			log.info(err)
			console.log(err)

		}else{

			console.log(result.result)
			if (result.result.n == 0){

				//the record was not found, so we need to insert it
				
				db.insertItemRecord(item, function(err,result){

					if (err){
						log.info('[update_item_db] Error inserting record', item)
						log.info(err)

						console.log(err)
					}else{
						console.log("inserted ",item.id,result.result)
					}

					updateItemRecord()
				})


			}else{

				console.log("update",item.id,result.result)
				updateItemRecord()

			}

		}

	})


}

log.info("[update_item_db] Looking for item records in: ", __dirname + '/../data/item_*.json')

glob(__dirname + '/../data/item_*.json', {}, function (er, files) {

	sourceFiles = files

	log.info("[update_item_db] Going to update records in ", files.length, " files.")


	console.log("Going to update records in ", files.length, " files.")

	//wait for any pending writes to complete from the download script
	setTimeout(function(){


		for (var file in files){

			file = files[file]

			if (records.length > 10000) break

			var content = fs.readFileSync(file);

			content = JSON.parse(content)

			if (content.entries){

				log.info("[update_item_db] Parsing: ", file)


				for (var x in content.entries){

					records.push(content.entries[x])
				}


			}else{
				log.info("[update_item_db] Error parsing: ", file)
			}



		}


		log.info("[update_item_db] Will update/insert ", records.length, " records.")

		//start the first one
		updateItemRecord()


	},5000)





})






