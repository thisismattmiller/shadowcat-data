#!/usr/local/bin/node

// var db = require("../lib/db.js")
// var util = require("../lib/util.js")
// var async = require("async")
// var fs = require("fs")
// require("string_score");

var cluster = require('cluster');


if (cluster.isMaster) {



	var db = require("../lib/db.js")

	var queue = {}

	var countTotal = 0, countTotalFast = 0, countTotalLocal = 0, countBibRecords = 0

	//empty out the FAST terms table that we build for later use
	// db.returnRegistryDb(function(err, databaseRegistry){
	// 	var termsSameAsCollection = databaseRegistry.collection('termsSameAs')
	// 	termsSameAsCollection.drop(function(err,results){
	// 		databaseRegistry.close()
	// 	})
	// })


	//maintain a queue of work for the workers to get through
	db.allBibs(function(bib,cursor,mongoConnection){


		if (!bib){
			console.log("End of bib records reached.")
			return false
		}

		// if (bib['sc:terms']){
		// 	//it already has the terms done
		// 	countBibRecords++
		// 	process.stdout.clearLine()
		// 	process.stdout.cursorTo(0)			
		// 	process.stdout.write("Terms | countBibRecords: " + countBibRecords + " countTotal: " + countTotal + " countTotalFast: " + countTotalFast + " countTotalLocal: " + countTotalLocal )

		// 	cursor.resume()
		// 	return false
		// }
		

		queue[bib._id] = { bib: bib, working: false }

		//are there enough in the queue?
		if (Object.keys(queue).length < 10000){
			cursor.resume()
		}else{

			setTimeout(function(){
				cursor.resume()
			},10000)


		}

	})


	//the worker function
	var buildWorker = function(){

		var worker = cluster.fork();

		worker.on('message', function(msg) {
			if (msg.req) {
				//they are asking for new work
				for (var x in queue){
					if (!queue[x].working){
						queue[x].working = true
						worker.send({ req: queue[x].bib })
						return true
						break;
					}
				}
				console.log("Nothing letf to work in the queue!")

				worker.send({ sleep: true })
			}
			if (msg.res) {

				countBibRecords++
				countTotal = countTotal + (msg.fastCount + msg.localCount)
				countTotalFast = countTotalFast + msg.fastCount
				countTotalLocal = countTotalLocal + msg.localCount

				process.stdout.clearLine()
				process.stdout.cursorTo(0)
				process.stdout.write("Terms | countBibRecords: " + countBibRecords + " countTotal: " + countTotal + " countTotalFast: " + countTotalFast + " countTotalLocal: " + countTotalLocal + " last: " + msg.res)

				

				//they are done with this record, delete it from the queue
				delete queue[msg.res]
			}
		})

		worker.on('exit', function(code, signal) {



			console.log("WORKER#: ", worker.id)
			if( signal ) {
				console.log("worker was killed by signal: "+signal)
			} else if( code !== 0 ) {
				console.log("worker exited with error code: "+code)
				buildWorker()
			} else {
				console.log("worker success!")
			}


		})



	}



	var check = setInterval(function(){

		if (Object.keys(queue).length > 1000){

			clearTimeout(check)

			buildWorker()
			buildWorker()
			buildWorker()
			buildWorker()


		}else{
			console.log("Nothing in queue yet.")
		}


	},10000)







}else{


	var db = require("../lib/db.js")
	var util = require("../lib/util.js")
	var async = require("async")
	//var fs = require("fs")
	//require("string_score");

	console.log('Worker #', cluster.worker.id, " starting up.")


	db.returnRegistryDb(function(err, databaseRegistry){

		db.returnShadowcatDb(function(err, databaseShadowcat){

			var termsSameAs = databaseRegistry.collection('termsSameAs') 
			var fastLookup = databaseRegistry.collection('fastLookup') 
			var viafLookup = databaseRegistry.collection('viafLookup') 


			var processRecord = function(msg) {

				if (msg.sleep){

					console.log('Worker #',cluster.worker.id," No work! Going to sleep for 300 sec ")

					setTimeout(function(){process.send({ req: true });},300000)
				

					return true
				}


				if (msg.req){

					var finalTerms = []

					//this is the new record
					var bib = msg.req



					//console.log('Worker #',cluster.worker.id," working on ", bib._id)

					//work..	
					var terms = util.returnTerms(bib)


					//we need to check against FAST if any of these terms that don't have FAST ids match anything
					async.each(terms, function(term, eachCallback) {


						//find if this one exists

						//var normal = util.normalizeAndDiacritics(name.name)

						// if (term.nameLocal === false){
						// 	console.log(term)
						// }



						// if (term.nameLocal && term.nameFast){
						// 	//if they are not the same we are intrested in what is being mapped from local to FAST and 
						// 	//if that that can be used globally
						// 	if (util.singularize(util.normalizeAndDiacritics(term.nameLocal)) != util.singularize(util.normalizeAndDiacritics(term.nameFast))){
						// 		//throw this into the database for later use
						// 		termsSameAs.insert({ fast: term.fast, nameLocal:term.nameLocal, nameFast: term.nameFast  },function(err,result){
						// 			if (err) console.log(err)
						// 		})
						// 	}
						// }

						//if it has a FAST id  we need to make sure:

						if (term.fast){

							//make sure it is not in VIAF
							viafLookup.find({ fast : term.fast }).toArray(function(err, viafAry) {

								if (viafAry.length>0){

									//it is in VIAF , so it is name, do not add it in as a term for this bib									
									eachCallback()

								}else{


									//it is not in viaf, so it is legit, if it does not have a type then we need to get that
									if (!term.type){

										
										fastLookup.find({ _id : term.fast }).toArray(function(err, fastAry) {

											if (fastAry.length>0){
												if (fastAry[0].type) term.type = fastAry[0].type
											}

											//hopefully that worked, add it to the final
											finalTerms.push(term)
											eachCallback()
										})

										

									}else{


										//everything is all set, add it into the final list
										finalTerms.push(term)
										eachCallback()

									}						

								}


							})


							

						}else{

							//it is a local term, see if for some reason it lives in the FAST lookup table normalized
							var normal = util.singularize(util.normalizeAndDiacritics(term.nameLocal))

							fastLookup.find({ normalized : normal }).toArray(function(err, fastAry) {

								if (fastAry.length>0){
									
									//it found something, add in the data
									if (fastAry[0].prefLabel) term.nameFast = fastAry[0].prefLabel
									if (fastAry[0]._id) term.fast = fastAry[0]._id	
									if (fastAry[0].type) term.type = fastAry[0].type	

								}

								//add it into the final ary
								finalTerms.push(term)

								eachCallback()
							})

						}

						

					//fires when all the lookups are done		

					}, function(err){



						var fastCount = 0, localCount = 0
						finalTerms.map(function(t){

							if (t.fast){ fastCount++; }else{ localCount++ }

						})


						//update the bib record
						var update = {
							id : bib._id,
							'sc:terms' : finalTerms
						}

						db.updateBibRecord(update,function(){

							process.send({ res: bib._id, fastCount: fastCount, localCount: localCount });

							//ask for a new one
							process.send({ req: true });
								


						},databaseShadowcat)




					})






				}



			}




			process.on('message', processRecord)

			process.send({ req: true });

		})

	})

}


