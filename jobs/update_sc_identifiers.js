#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")


var opts = {
    logDirectory: __dirname + '/../log',
    fileNamePattern: 'log-<date>.log',
    dateFormat:'YYYY.MM.DD'
};

var log = require('simple-node-logger').createRollingFileLogger( opts );

log.info('[update_sc_identifiers] Starting up script')


//see if this process is running already
util.checkIfRunning(function(isRunning){
	if (isRunning){
      	console.log("Already running ")
		log.info('[update_sc_identifiers] Already running')
      	process.exit()
	}
})



var counter = 0, counterRecords = 0
var counterOclc = 0, counterIsbn = 0, counterIssn = 0


//update the log every 15min

setInterval(function(){
	log.info('[update_sc_identifiers] Seeked: ', counter, ' Modified ', counterRecords , ' records. OCLC:',counterOclc," ISBN: ",counterIsbn, " ISSN: ", counterIssn)
},300000)
	

db.allBibsReverse(function(bib,cursor,mongoConnection){

	counter++


	if (counter > 500000){
		log.info('[update_sc_identifiers] Done. Modified ', counterRecords , ' records. OCLC:',counterOclc," ISBN: ",counterIsbn, " ISSN: ", counterIssn)
		util.exit()
		mongoConnection.close()
	}


	if (!cursor){
		log.info('[update_sc_identifiers] Done. Modified ', counterRecords , ' records. OCLC:',counterOclc," ISBN: ",counterIsbn, " ISSN: ", counterIssn)
		util.exit()
	}

	var results = util.extractScIdentifiers(bib)

	var updateRecord = { id : bib.id }


	//do we have any oclc?
	if (results.oclc.length>0){
		if (!bib['classify:oclc']){			
			updateRecord['sc:oclc'] = results.oclc
		}
	}

	if (results.isbn.length>0){
		updateRecord['sc:isbn'] = results.isbn
	}

	if (results.issn.length>0){
		updateRecord['sc:issn'] = results.issn
	}

	if (updateRecord['sc:oclc'] || updateRecord['sc:isbn'] || updateRecord['sc:issn']){
		counterRecords++
		if (updateRecord['sc:oclc']) counterOclc++
		if (updateRecord['sc:isbn']) counterIsbn++
		if (updateRecord['sc:issn']) counterIssn++

		db.updateBibRecord(updateRecord,function(err,r){

			if (err) console.log("ERRROR:",err)

			console.log(updateRecord)
			console.log(r.result)

			cursor.resume()

		}, mongoConnection)

	}else{
		cursor.resume()
	}

})



