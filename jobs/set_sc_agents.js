#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")
var async = require("async")
var fs = require("fs")
var human = require('humanparser')

require("string_score")

var counter = 0

var namePartSubcode = ['a','b','c','d','q','n']
var checkFields = ['100','110','111','700','710','711','600','610','611']

var countFoundInLC = 0
var countFoundInViafViaOclc = 0
var countLocal = 0
var countAddedUnmatchedNames = 0
var countTotalNames = 0
var relatorsCodes = {}



setInterval(function(){

	var r = {
		countTotalNames: countTotalNames,
		countFoundInLC: countFoundInLC,
		countFoundInViafViaOclc: countFoundInViafViaOclc,
		countLocal: countLocal,
		countAddedUnmatchedNames: countAddedUnmatchedNames,
		relatorsCodes: relatorsCodes,
	}

	fs.writeFile(__dirname + '/../log/agent_results.json', JSON.stringify(r,null,4), function (err) {

		if (err) console.log(err)

	})

},30000)

db.returnViafLookup(function(err,viafLookup){



	db.allBibs(function(bib,cursor,mongoConnection){

		process.stdout.clearLine()
		process.stdout.cursorTo(0)
		process.stdout.write( counter + " | " +  "countTotalNames: " + countTotalNames + " countFoundInLC: " + countFoundInLC + " countFoundInViafViaOclc: " + countFoundInViafViaOclc + " countLocal: " + countLocal + " countAddedUnmatchedNames: " + countAddedUnmatchedNames )


		if (!bib){

			console.log("\n\nFinshed!\n\n")
			setTimeout(function(){


				process.exit()
			},1000)


			return


		}

		counter++

		var names = []

			
		
		//build all the agents

		if (bib.varFields){



			for (var field in bib.varFields){


				field = bib.varFields[field]
				//100, 110, 111
				//700, 710, 711

				if (field.marcTag){
					if (checkFields.indexOf(field.marcTag) > -1){

						var name = "", relator = false

						if (field.subfields){

							for (var subfield in field.subfields){

								subfield = field.subfields[subfield]

								if (subfield.tag){
									if (namePartSubcode.indexOf(subfield.tag) > -1){
										if (subfield.content){
											name = name + " " + subfield.content
										}
									}

									if (subfield.tag == 'e' || subfield.tag == '4'){
										if (subfield.content){
											relator = subfield.content
										}
									}
								}

								



							}


						}

						name = name.trim()

						if (name != ""){
							if (field.marcTag != '600' && field.marcTag != '610' && field.marcTag != '611'){
								names.push( { name: name, relator:relator, contributor : true } )
							}else{
								names.push( { name: name, relator:relator, contributor : false } )


							}
						}
						 






					}

				}





			}


		}







		var newNames = []

		//console.log("names:",names)

		async.each(names, function(name, eachCallback) {


			//find if this one exists

			var normal = util.normalizeAndDiacritics(name.name)




			viafLookup.find({ $or :[ {normalized : normal}, {normalized : normal+' '} ]}).toArray(function(err, viafAry) {

				if (viafAry.length>0){

					// console.log(name.name,bib._id)
					// console.log(viafAry[0])

					name.viafName = viafAry[0].prefLabel
					name.viafId = viafAry[0]._id


				}else if (viafAry.length==0){

					//console.log("No match ------ ",bib._id)
					//console.log(name)					
					name.viafId = false




				}


				newNames.push(name)
				eachCallback()	

			})
		

		//fires when all the lookups are done		

		}, function(err){
		   	if (err) console.log(err)


		   	var checkOclc = false
		   	newNames.map(function(name){if (!name.viafId) checkOclc = true})

		   //	console.log("checkOclc:",checkOclc)
		   //	console.log("newNames:",newNames)

		   	if (checkOclc){

		   		


		   		//lets gather all of our viaf IDS and their labels
		   		var viafIds = [], viafNameLookup = {}

		   		if (bib['classify:creatorVIAF']){
		   			bib['classify:creatorVIAF'].map(function(v){ if (viafIds.indexOf(v)==-1){ viafIds.push(v); if (!viafNameLookup[v]) viafNameLookup[v] = { nameLc: "", nameViaf: "", contributor: true } }  })
		   		}

		   		if (bib['wc:contributor']){
		   			bib['wc:contributor'].map(
		   				function(v){ 

			   				if (viafIds.indexOf(v.id)==-1){
			   					viafIds.push(v.id)		   					
			   					if (!viafNameLookup[v.id])
			   						viafNameLookup[v.id] = { nameLc: "", nameViaf: v.name, contributor: true }
			   				}

		   					//make sure it has the name 
		   					if (v.name != "" && viafNameLookup[v.id].nameViaf == "") viafNameLookup[v.id].nameViaf = v.name
		   				})
		   		}

		   		if (bib['wc:creator']){

		   			bib['wc:creator'].map(
		   				function(v){ 
		   					
			   				if (viafIds.indexOf(v.id)==-1){
			   					viafIds.push(v.id)		   					
			   					if (!viafNameLookup[v.id])
			   						viafNameLookup[v.id] = { nameLc: "", nameViaf: v.name, contributor: true  }
			   				}

		   					//make sure it has the name 

		   					if (v.name != "" && viafNameLookup[v.id].nameViaf == "") viafNameLookup[v.id].nameViaf = v.name
		   				})
		   		}

		   		if (bib['wc:aboutViaf']){

		   			bib['wc:aboutViaf'].map(
		   				function(v){ 
		   					
			   				if (viafIds.indexOf(v.id)==-1){
			   					viafIds.push(v.id)		   					
			   					if (!viafNameLookup[v.id])
			   						viafNameLookup[v.id] = { nameLc: "", nameViaf: v.name, contributor: false }
			   				}

		   					//make sure it has the name 

		   					if (v.name != "" && viafNameLookup[v.id].nameViaf == "") viafNameLookup[v.id].nameViaf = v.name


		   				})
		   		}


		   		//create a jank alt name from any viaf natural lanuage one


		   		for (var x in viafNameLookup){

		   			if (viafNameLookup[x].nameViaf){

		   				var parts = human.parseName(viafNameLookup[x].nameViaf);

		   				if (parts.firstName && parts.lastName){

		   					viafNameLookup[x].nameViafAlt = ""
		   					viafNameLookup[x].nameViafAlt = viafNameLookup[x].nameViafAlt + parts.lastName 
		   					if (parts.suffix) viafNameLookup[x].nameViafAlt = viafNameLookup[x].nameViafAlt + " " + parts.suffix

		   					viafNameLookup[x].nameViafAlt = viafNameLookup[x].nameViafAlt + ", " + parts.firstName + " "
		   					if (parts.middleName) viafNameLookup[x].nameViafAlt = viafNameLookup[x].nameViafAlt + " " + parts.middleName
		   					viafNameLookup[x].nameViafAlt = viafNameLookup[x].nameViafAlt.trim()
		   				}
		   				

		   			}

		   		}




		   		//now grab the possible records for all these viafs


				viafLookup.find({ _id : {$in : viafIds } }).toArray(function(err, viafAry) {

					//loop through and fill out any data

					//console.log("viafAry:",viafAry)

					viafAry.map(function(v){
						if (viafNameLookup[v._id]) viafNameLookup[v._id].nameLc = v.prefLabel
					})

					//remove any matches we know of already
					// newNames.map(function(n){
					// 	if (n.viafId){
					// 		delete viafLookup[n.viafId]
					// 	}
					// })

					//the idea is to try and match local names to worldcat names at an increasingly higher threashold
					//until there are no duplicate VIAF identfiers among the agents


					var viafDupe = true, viafDupeCheck = 0, threshold = 0.1
					var ogNewNames = JSON.parse(JSON.stringify(newNames))

					//this first loop makes sure we did not reuse the same VIAF id in two agents, if so try it all again with a higher intail threshold
					while (viafDupe === true && viafDupeCheck < 11){
						
						var hasDupe = true, dupeCheckCount = 0

						//this second loop does the matching withing the agents to try to assign the best Viaf name to local name, it too checks for dupes at the per record scale 
						while (hasDupe === true && dupeCheckCount < 11){

							threshold = threshold + 0.1
							dupeCheckCount++
							hasDupe=false


							newNames = JSON.parse(JSON.stringify(ogNewNames))

							//now try to match anything left with the viaf entries
							newNames.map(function(n){
								if (!n.viafId){			

									var bestMatch = false, bestScore = -100;				
									for (var x in viafNameLookup){

										//all we really care about is if this possibly local name is represented somehow in the 
										//data from world cat or classify
										
										var scoreLc = 0, scoreViaf = 0, scoreViafAlt = 0

										if (viafNameLookup[x].nameLc) scoreLc = n.name.score(viafNameLookup[x].nameLc,0.5)
										if (viafNameLookup[x].nameViaf) scoreViaf = n.name.score(viafNameLookup[x].nameViaf,0.5)
										if (viafNameLookup[x].nameViafAlt) scoreViafAlt = n.name.score(viafNameLookup[x].nameViafAlt,0.5)

										if ( scoreLc > threshold || scoreViaf > threshold || scoreViafAlt > threshold){		


											var newScore = (scoreLc >= scoreViaf) ? scoreLc : scoreViaf
											if (scoreViafAlt > newScore) newScore = scoreViafAlt



											//console.log(n.name, " | ", viafNameLookup[x].nameLc, " > ",scoreLc)
											if (newScore>bestScore) bestMatch = x
										}
									}

									if (bestMatch){
										for (var y in newNames){
											if (newNames[y].name==n.name){
												newNames[y].matchedViaf = parseInt(bestMatch)

												//console.log('---------',bib._id)
												//console.log(newNames[y].name, " === ", viafNameLookup[bestMatch],bestScore)	

											}								
																					
										}

									}



								}


							})

							var dupeCheck = {}

							newNames.map(function(n){					

								if (n.matchedViaf){
									if (dupeCheck[n.matchedViaf+n.relator.toString()]){
										hasDupe=true
									}else{
										dupeCheck[n.matchedViaf+n.relator.toString()] = true
									}
								}
							})

						}


						var dupeCheckViaf = {}

						newNames.map(function(n){					

							if (n.viafId){
								if (!dupeCheckViaf[n.viafId]) dupeCheckViaf[n.viafId] = 0	
								dupeCheckViaf[n.viafId]++						
							}
							if (n.matchedViaf){
								if (!dupeCheckViaf[n.matchedViaf]) dupeCheckViaf[n.matchedViaf] = 0	
								dupeCheckViaf[n.matchedViaf]++						
							}
			
						})

						//console.log("dupeCheckViaf",dupeCheckViaf)

						viafDupe = false
						viafDupeCheck++

						for (var i in dupeCheckViaf){
							if (dupeCheckViaf[i]>1){
								viafDupe=true
								threshold=threshold+0.5
								//console.log("HAS DUPE VIAF, increading threshold!",threshold)
							}
						}		


					}
	

					if (hasDupe){
						console.log("\n\nRecord still contains dupes:",bib._id,"\n\n")
					}



			  		//lets make a list of all the viaf that we did find
			  		var empolyedViaf = []

			  		newNames.map(function(n){
			  			if (n.viafId) if (empolyedViaf.indexOf(parseInt(n.viafId)) == -1) empolyedViaf.push(parseInt(n.viafId))
			  			if (n.matchedViaf) if (empolyedViaf.indexOf(parseInt(n.matchedViaf)) == -1) empolyedViaf.push(parseInt(n.matchedViaf))
			  		})
			  		var unusedViaf = []

			  		//console.log("unusedViaf",unusedViaf)

			  		viafIds.map(function(n){
			  			if (empolyedViaf.indexOf(n)==-1) unusedViaf.push(n)
			  		})

			  		if (unusedViaf.length!=0){



			  			//console.log("Did not match local to anything:")
			  			// newNames.map(function(n){
			  			// 	if (!n.viafId && !n.matchedViaf) console.log("\t",n.name)
			  			// })

			  			// //console.log("Did not find local name for viaf:")

			  			// unusedViaf.map(function(n){
			  			// 	console.log("\t",n,viafNameLookup[n])
			  			// })


				  		if (newNames.length == 1 && unusedViaf.length == 1){

				  			for (var y in newNames){
				  				if (!newNames[y].matchedViaf && !newNames[y].viafId){
				  					newNames[y].matchedViaf = unusedViaf[0]
				  					unusedViaf = []
				  				}
				  			}

				  			
				  		}


				  	}

					// console.log(newNames)
			  //  		console.log(viafIds)
			  //  		console.log(viafNameLookup)
			  //  		console.log(unusedViaf)
			   		





			   		//at this point everything that we can map is mapped, build the final agents field
			   		var agents = []

					


			   		//console.log("newNames:",newNames)

			   		newNames.map(function(n){

			   			var a = {}

			   			a.nameLocal = n.name
			   			a.relator = n.relator
			   			a.contributor = n.contributor

			   			if (n.relator){
			   				if (relatorsCodes[n.relator]){
			   					relatorsCodes[n.relator]++
			   				}else{
			   					relatorsCodes[n.relator] = 1
			   				}
			   			}

			   			countTotalNames++

			   			//did we match it to viaf ourselves?
			   			if (n.viafId){
			   				//yes
			   				a.nameLc = (viafNameLookup[n.viafId]) ? viafNameLookup[n.viafId].nameLc : false
			   				a.nameViaf = (viafNameLookup[n.viafId]) ? viafNameLookup[n.viafId].nameViaf : false
			   				a.viaf = n.viafId

			   				countFoundInLC++

			   			}else if (n.matchedViaf){
			   				// with help from worldcat or classify
			   				a.nameLc = (viafNameLookup[n.matchedViaf]) ? viafNameLookup[n.matchedViaf].nameLc : false
			   				a.nameViaf = (viafNameLookup[n.matchedViaf]) ? viafNameLookup[n.matchedViaf].nameViaf : false
			   				a.viaf = n.matchedViaf

			   				countFoundInViafViaOclc++

			   			}else{
			   				//we did not match it at all
			   				a.nameLc = false
			   				a.nameViaf = false
			   				a.viaf = false
			   				countLocal++
			   			}

			   			if (a.nameLc  === '') a.nameLc = false
			   			if (a.nameViaf  === '') a.nameViaf = false

			   			agents.push(a)



			   		})


			   		//now we need to take care of any un matched viaf results
			   		unusedViaf.map(function(v){

			   			if (viafNameLookup[v]){
			   				n = viafNameLookup[v]

			   				countTotalNames++

				   			var a = {}

				   			a.nameLocal = false
				   			a.relator = false
				   			a.contributor = n.contributor
			   				a.nameLc = n.nameLc
			   				a.nameViaf = n.nameViaf

			   				a.viaf = v

				   			if (a.nameLc  === '') a.nameLc = false
				   			if (a.nameViaf  === '') a.nameViaf = false
				   			countAddedUnmatchedNames++

			   				agents.push(a)

			   			}



			   		})

			   		var update = {
			   			id : bib._id,
			   			'sc:agents' : agents
			   		}



			   		db.updateBibRecord(update,function(){


			   			cursor.resume()


			   		},mongoConnection)




					


				})



		   		

		   	}else{


		   		

		   		var agents = []

		   		newNames.map(function(n){

		   			countTotalNames++

		   			var a = {}

		   			a.nameLocal = n.name
		   			a.relator = n.relator
		   			a.contributor = n.contributor

		   			if (n.relator){
		   				if (relatorsCodes[n.relator]){
		   					relatorsCodes[n.relator]++
		   				}else{
		   					relatorsCodes[n.relator] = 1
		   				}
		   			}

		   			//did we match it to viaf ourselves?
		   			if (n.viafId){

		   				//yes
		   				a.nameLc = n.viafName
		   				a.nameViaf = false
		   				a.viaf = n.viafId

		   				countFoundInLC++

		   			}

		   			if (a.nameLc  === '') a.nameLc = false
		   			if (a.nameViaf  === '') a.nameViaf = false

		   			agents.push(a)



		   		})



		   		//console.log('\n\n\n---------',bib._id,bib['sc:oclc'],bib['classify:oclc'],bib['lc:oclc'])

		   		//console.log(agents)


		   		var update = {
		   			id : bib._id,
		   			'sc:agents' : agents
		   		}



		   		db.updateBibRecord(update,function(){

		   			cursor.resume()


		   		},mongoConnection)


		   	}
		   	
		   	

		})		


	})

})
