#!/usr/local/bin/node


//This script loads bib records from the API based on the date in the db.meta.find({name:"metadata"}) bibLastUpdatedDate

var api = require("../lib/api.js")
var config = require("config")
var db = require("../lib/db.js")
var util = require("../lib/util.js")
var moment = require('moment')

var key = false
var activity = false

var opts = {
    logDirectory: __dirname + '/../log',
    fileNamePattern: 'log-<date>.log',
    dateFormat:'YYYY.MM.DD'
}

var log = require('simple-node-logger').createRollingFileLogger( opts );

log.info('[update_bib] Starting up script')


//see if this process is running already
//doing this from cron on the server so 1 = the PS, 2 = the shell script running the cron job, 3 = the node job
util.checkIfRunning(function(isRunning){
	if (isRunning){
      	console.log("Already running.")
		log.info('[update_bib] Already running.' )
      	process.exit()
	}
})


//5min timer to make sure the script is not running past the desginated timeframe
//every 5 min check the activity flag
setInterval(function(){
	if (!util.checkBibUpdateTime()){
		log.info('[update_bib] Timer check caught us running past run window, quitting. ')
		util.exit()
	}else{

		if (activity){
			activity = false
		}else{
			log.info('[update_bib] There has been no activity for 5 min, quitting. ')
			util.exit()
		}
	}
},300000)







if (util.checkBibUpdateTime()){


	db.getMetadata(function(err,metadata){

		if (err){
			log.info('[update_bib] error retriving metadata: ',err)
			util.exit()
		}else{

			metadata = metadata[0]
			log.info('[update_bib] metadata response: ',metadata)

			log.info('[update_bib] Starting API connection')

			var startingMoment = moment(metadata.bibLastUpdatedDate,"YYYY-MM-DD")

			api.setApi('prod')


			api.authToken(function(keyValue){

				if (keyValue){

					key = keyValue;

					//if that worked then make sure our key stays up to date every 50 min
					setInterval(function(){
						api.authToken(function(keyValue){
							key = keyValue;
							console.log("\nnew key:",key)
							log.info('[update_bib] Getting new Key')
						})
					},3000000)

					//if there is a letfover offset start up with that one
					var offset = metadata.bibLastUpdatedOffset

					//lets define a function we can pass as the callback of the api response, so when the data is ready
					var next = function(data){

						activity = true

						log.info('[update_bib] Downloaded ' + data['entries'].length + " records")


						var totalRecords = -1
						if (data.total){
							totalRecords = data.total
						}

						if (data.url){

							log.info('[update_bib] ', data.url)
						}



						// move the offset ahead based on how many we got back
						offset = offset + (data['entries'].length)

						api.saveData(data,"bib");

						//save the current metdata incase we crash or something
						db.updateBibMetadata(metadata.bibLastUpdatedDate,offset, function(){
							log.info('[update_bib] Saved metadata: ', metadata.bibLastUpdatedDate, " ", offset, " There are total: ", totalRecords)
						})


						//the 50 is hardcoded, optimal number of records to get back
						//if it is less than 50 then we are done with this day and we should move on
						if (data['entries'].length < 50){
							console.log("Looks like it is complete!")
							log.info('[update_bib] Looks like it is complete!', data['entries'].length, " ", metadata.bibLastUpdatedDate)



							var testDate = moment(metadata.bibLastUpdatedDate,"YYYY-MM-DD")
							testDate.add(1, 'days')


							//if the date we are about to increment to is beyond today, stop.
							if (testDate.isAfter(moment().format("YYYY-MM-DD"))){

								log.info('[update_bib] Looks like we are up to date: ', metadata.bibLastUpdatedDate)
								util.exit()

							}else{


								//we need to update the metadata doc with the new date and set it here if we need to continue on
								startingMoment.add(1, 'days')
								metadata.bibLastUpdatedDate = startingMoment.format("YYYY-MM-DD")
								offset = 0

								log.info('[update_bib] Continuing on to the next day: ', metadata.bibLastUpdatedDate)


								db.updateBibMetadata(metadata.bibLastUpdatedDate,offset, function(){
									log.info('[update_bib] Saved metadata: ', metadata.bibLastUpdatedDate, offset)
								})

								api.downloadRecent(metadata.bibLastUpdatedDate + "T00:00:00Z",metadata.bibLastUpdatedDate + "T23:59:59Z",key,'bibs','updatedDate',offset,next);


							}
							

						}else{

						
							//make sure it is not past bed time
							if (util.checkBibUpdateTime()){


								//we want to stay in this day range, but change the start time to the last update returned for this day
								api.downloadRecent(metadata.bibLastUpdatedDate + "T00:00:00Z",metadata.bibLastUpdatedDate + "T23:59:59Z",key,'bibs','updatedDate',offset,next);

							}else{

								log.info('[update_bib] It is past our bed time, stoping the script. ')

								util.exit()

							}

						}



					}

					log.info('[update_bib] First one: ', metadata.bibLastUpdatedDate)

					//the first request, it is the date starting at midnight
					api.downloadRecent(metadata.bibLastUpdatedDate + "T00:00:00Z",metadata.bibLastUpdatedDate + "T23:59:59Z",key,'bibs','updatedDate',offset,next);




				}else{
					console.log("Error authorizing and retriving token. Make sure your credentials are set in the config file.")
				}
				
			})


		}
		
		

	})


}else{

	log.info('[update_bib] Not in run window: ', util.checkBibUpdateTime(true) )
	util.exit()


}




