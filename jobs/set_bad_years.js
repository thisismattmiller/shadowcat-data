#!/usr/local/bin/node

var db = require("../lib/db.js")
var util = require("../lib/util.js")

var counter = 0

var manualLog = require('simple-node-logger').createSimpleLogger(__dirname + '/../log/18thCentUpdates.log')


var extract362 = function(obj){

	var r = ''

	if (obj.marcTag){
		if (obj.marcTag === '362'){
			if (obj.subfields){
				for (var x in obj.subfields){
					if (obj.subfields[x].tag){
						if (obj.subfields[x].tag.trim().toLowerCase() === 'a'){
							if (obj.subfields[x].content) r = r + obj.subfields[x].content + ' '
						}
					}
				}
				if (r.trim() != '') return r.trim()
			}
		}
	}
	return false
}

var extract260 = function(obj){

	var r = ''

	if (obj.marcTag){
		if (obj.marcTag === '260'){
			if (obj.subfields){
				for (var x in obj.subfields){
					if (obj.subfields[x].tag){
						if (obj.subfields[x].tag.trim().toLowerCase() === 'c'){
							if (obj.subfields[x].content) r = r + obj.subfields[x].content + ' '
						}
					}
				}
				if (r.trim() != '') return r.trim()
			}
		}
	}
	return false
}

var extract852 = function(obj){

	var r = ''

	if (obj.marcTag){
		if (obj.marcTag === '852'){
			if (obj.subfields){
				for (var x in obj.subfields){
					if (obj.subfields[x].tag){
						if (obj.subfields[x].tag.trim().toLowerCase() === 'z'){
							if (obj.subfields[x].content) r = r + obj.subfields[x].content + ' '
						}
					}
				}
				if (r.trim() != '') return r.trim()
			}
		}
	}
	return false
}



var extractYears = function(stringAry){

	var years = []
	for (var x in stringAry){

		if (stringAry[x]){
			if (stringAry[x].match(/\D19[0-9]{2}\D/)) years.push(parseInt(stringAry[x].match(/\D(19[0-9]{2})\D/)[1]))
			if (stringAry[x].match(/\D18[0-9]{2}\D/)) years.push(parseInt(stringAry[x].match(/\D(18[0-9]{2})\D/)[1]))
			if (stringAry[x].match(/\D20[0-9]{2}\D/)) years.push(parseInt(stringAry[x].match(/\D(20[0-9]{2})\D/)[1]))

			if (stringAry[x].match(/^19[0-9]{2}\D/)) years.push(parseInt(stringAry[x].match(/^(19[0-9]{2})\D/)[1]))
			if (stringAry[x].match(/^18[0-9]{2}\D/)) years.push(parseInt(stringAry[x].match(/^(18[0-9]{2})\D/)[1]))
			if (stringAry[x].match(/^20[0-9]{2}\D/)) years.push(parseInt(stringAry[x].match(/^(20[0-9]{2})\D/)[1]))

			if (stringAry[x].match(/^.*\D19[0-9]{2}$/)) years.push(parseInt(stringAry[x].match(/^.*\D(19[0-9]{2})$/)[1]))
			if (stringAry[x].match(/^.*\D18[0-9]{2}$/)) years.push(parseInt(stringAry[x].match(/^.*\D(18[0-9]{2})$/)[1]))
			if (stringAry[x].match(/^.*\D20[0-9]{2}$/)) years.push(parseInt(stringAry[x].match(/^.*\D(20[0-9]{2})$/)[1]))

			if (stringAry[x].match(/^19[0-9]{2}$/)) years.push(parseInt(stringAry[x].match(/^19[0-9]{2}$/)[0]))
			if (stringAry[x].match(/^18[0-9]{2}$/)) years.push(parseInt(stringAry[x].match(/^18[0-9]{2}$/)[0]))
			if (stringAry[x].match(/^20[0-9]{2}$/)) years.push(parseInt(stringAry[x].match(/^20[0-9]{2}$/)[0]))
		}

	}

	return years


}



var totalChanged = 0

db.allBibs(function(bib,cursor,mongoConnection){


	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + " | " + totalChanged )

	counter++


	if (!bib.publishYear) bib.publishYear = 0

	//if (bib['sc:publishYear']) bib.publishYear = bib['sc:publishYear']

	if (bib.publishYear.toString().length != 4){


		if (bib.varFields){

			var mapResults = bib.varFields.map(extract260)
			var dates = []

			for (var x in mapResults){
				if (mapResults[x] && dates.indexOf(mapResults[x].trim()) === -1) dates.push(mapResults[x])
			}

			mapResults = bib.varFields.map(extract362)

			for (var x in mapResults){
				if (mapResults[x] && dates.indexOf(mapResults[x].trim()) === -1) dates.push(mapResults[x])
			}
			
			mapResults = bib.varFields.map(extract852)

			for (var x in mapResults){
				if (mapResults[x] && dates.indexOf(mapResults[x].trim()) === -1) dates.push(mapResults[x])
			}
			


			//lets see if we got any year dates out of this
			var years = extractYears(dates)

			if (years.length == 0){


				//try the items
				db.returnItemByBibIds(bib.id,function(err,items){

					var dates = []
					if (items.length > 0){
						for (var x in items){
							if (items[x].varFields){

								for (var varField in items[x].varFields){

									varField= items[x].varFields[varField]

									if (varField.fieldTag){
										if (varField.fieldTag === 'v') dates.push(varField.content)
									}


								}



							}


						}	

					}

					var years = extractYears(dates)


					if (years.length>0){

						var years = years = years.sort(function (a, b) {return a - b;})
						if (years[0] < 1900) manualLog.info(bib.id, " -> ", years)

						var updateRecord = {
							id : bib.id,
							'sc:publishYear' : years[0]
						}

						db.updateBibRecord(updateRecord,function(err,r){

							if (err) console.log("ERRROR:",err)
							console.log(updateRecord)
							console.log(r.result)
							totalChanged++
							cursor.resume()

						}, mongoConnection)

					}else{

						cursor.resume()
					}


					
					
					
					

				}, mongoConnection)				






			}else{

				if (years.length>0){

					var years = years = years.sort(function (a, b) {return a - b;})
					if (years[0] < 1900) manualLog.info(bib.id, " -> ", years)

					var updateRecord = {
						id : bib.id,
						'sc:publishYear' : years[0]
					}

					db.updateBibRecord(updateRecord,function(err,r){

						if (err) console.log("ERRROR:",err)
						console.log(updateRecord)
						console.log(r.result)
						totalChanged++
						cursor.resume()

					}, mongoConnection)

				}else{

					cursor.resume()
				}



			}


		}else{ cursor.resume() }





	}else{ cursor.resume()}

	



})

