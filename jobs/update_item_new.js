#!/usr/local/bin/node

var api = require("../lib/api.js")
var config = require("config")
var db = require("../lib/db.js")
var moment = require('moment')
var util = require("../lib/util.js")

var key = false
var activity = false

var opts = {
    logDirectory: __dirname + '/../log',
    fileNamePattern: 'log-<date>.log',
    dateFormat:'YYYY.MM.DD'
};

var log = require('simple-node-logger').createRollingFileLogger( opts );

log.info('[update_item] Starting up script')

//see if this process is running already
util.checkIfRunning(function(isRunning){
	if (isRunning){
      	console.log("Already running ")
		log.info('[update_item] Already running instance count')
      	process.exit()
	}
})

//5min timer to make sure the script is not running past the desginated timeframe
//every 5 min check the activity flag
setInterval(function(){
	if (!util.checkItemUpdateTime()){
		log.info('[update_item] Timer check caught us running past run window, quitting. ')
		util.exit()
	}else{

		if (activity){
			activity = false
		}else{
			log.info('[update_item] There has been no activity for 5 min, quitting. ')
			util.exit()
		}
	}
},300000)





if (util.checkItemUpdateTime()){

	db.getMetadata(function(err,metadata){


		if (err){
			log.info('[update_item] error retriving metadata: ',err)
			util.exit()
		}else{
			metadata = metadata[0]
			log.info('[update_item] metadata response: ',metadata)

			log.info('[update_item] Starting API connection')

			var startingMoment = moment(metadata.itemLastUpdatedDate,"YYYY-MM-DD")	

			//if this is the first hour we are allowed to run
			var date = new Date()
			var currentHour = date.getHours()


			if (currentHour == util.checkItemUpdateTime(true)[0]){

				log.info('[update_item] It is the first hour of the run window')

				//check if the lastupdate date is today
				if ( startingMoment.isSame( moment().format("YYYY-MM-DD") )) {

					log.info('[update_item] The last update date is today: ', startingMoment.format("YYYY-MM-DD") )

					//this is likely the first run, we want to set back the last update date so it will 
					//redownload the last 3 months of created item records
					startingMoment.subtract(3, 'months')

					metadata.itemLastUpdatedDate = startingMoment.format("YYYY-MM-DD")
					metadata.itemLastUpdatedOffset = 0

					log.info('[update_item] Setting metadata.itemLastUpdatedDate to: ', metadata.itemLastUpdatedDate )

				}


			}


			api.setApi('prod')

			api.authToken(function(keyValue){

				if (keyValue){

					key = keyValue;

					//if that worked then make sure our key stays up to date every 50 min
					setInterval(function(){
						api.authToken(function(keyValue){
							key = keyValue;
							console.log("\nnew key:",key)
							log.info('[update_item] Getting new Key')
						})
					},3000000)

					//if there is a letfover offset start up with that one
					var offset = metadata.itemLastUpdatedOffset


					//lets define a function we can pass as the callback of the api response, so when the data is ready
					var next = function(data){

						log.info('[update_item] Downloaded ' + data['entries'].length + " records")
						
						activity = true


						var totalRecords = -1
						if (data.total){
							totalRecords = data.total
							console.log("totalRecords:",totalRecords)
						}

						if (data.url){

							log.info('[update_item] ', data.url)
						}


						// //find the last id to send back to the server + 1
						offset = offset + (data['entries'].length)


						api.saveData(data,"item")

						//save the current metdata incase we crash or something
						db.updateItemMetadata(metadata.itemLastUpdatedDate,offset, function(){
							log.info('[update_item] Saved metadata: ', metadata.itemLastUpdatedDate, " ", offset, " There are total: ", totalRecords)
						})



						if (data['entries'].length < 50){
							console.log("Looks like it is complete!")
							log.info('[update_item] Looks like it is complete!', data['entries'].length)


							var testDate = moment(metadata.itemLastUpdatedDate,"YYYY-MM-DD")
							testDate.add(1, 'days')


							//if the date we are about to increment to is beyond today, stop.
							if (testDate.isAfter(moment().format("YYYY-MM-DD"))){

								log.info('[update_item] Looks like we are up to date: ', metadata.itemLastUpdatedDate)
								util.exit()

							}else{


								//we need to update the metadata doc with the new date and set it here if we need to continue on
								startingMoment.add(1, 'days')
								metadata.itemLastUpdatedDate = startingMoment.format("YYYY-MM-DD")
								offset = 0

								log.info('[update_item] Continuing on to the next day: ', metadata.itemLastUpdatedDate)


								db.updateItemMetadata(metadata.itemLastUpdatedDate,offset, function(){
									log.info('[update_item] Saved metadata: ', metadata.itemLastUpdatedDate, offset)
								})

								api.downloadRecent(metadata.itemLastUpdatedDate + "T00:00:00Z",metadata.itemLastUpdatedDate + "T23:59:59Z",key,'items','createdDate',offset,next);


							}
							

						}else{

						
							//make sure it is not past bed time
							if (util.checkItemUpdateTime()){



								//we want to stay in this day range, but change the start time to the last update returned for this day
								api.downloadRecent(metadata.itemLastUpdatedDate + "T00:00:00Z",metadata.itemLastUpdatedDate + "T23:59:59Z",key,'items','createdDate',offset,next);

							}else{

								log.info('[update_item] It is past our bed time, stoping the script. ')

								util.exit()

							}

						}



					}

					log.info('[update_item] First one: ', metadata.itemLastUpdatedDate)

					//the first request, it is the date starting at midnight
					api.downloadRecent(metadata.itemLastUpdatedDate + "T00:00:00Z",metadata.itemLastUpdatedDate + "T23:59:59Z",key,'items','createdDate',offset,next);




				}else{
					console.log("Error authorizing and retriving token. Make sure your credentials are set in the config file.")
				}
			});


		}
		
		

	})


}else{

	log.info('[update_item] Not in run window: ', util.checkItemUpdateTime(true) )
	util.exit()

}




