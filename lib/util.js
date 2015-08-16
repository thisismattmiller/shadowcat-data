var config = require("config")
var fs = require("fs")
var csv = require("fast-csv")

var exec = require('child_process').exec

var exports = module.exports = {};

var coarseLCCRegExDecimal = new RegExp("^([A-Z]+)([0-9]+\.[0-9]+)")
var coarseLCCRegExNoDecimal = new RegExp("^([A-Z]+)([0-9]+)")
var oclcRegExp = new RegExp(/\(ocolc\).*?"/ig)




exports.coarseLCCLocate = function(prefix,number,lcc){


	//do we have this prefix
	if (lcc[prefix]){

		//loop through all them and try to locate where this one would fit in
		var matches = []

		for (var x in lcc[prefix]){

			if (number >= lcc[prefix][x].start && number <= lcc[prefix][x].stop ){


				matches.push(lcc[prefix][x])
			}
		}

		var mostParents = -1
		var use = false
		for (var x in matches){
			if (matches[x].parents.length > mostParents){
				use = matches[x].id
				mostParents = matches[x].parents.length
			}
		}

		return use

	}else{
		return false
	}
		

}

exports.extraCoarseLCCLocate = function(prefix,number,lcc){


	//do we have this prefix
	if (lcc[prefix]){

		//loop through all them locate who is the smallest parents

		var leastParents = 10000
		var use = false

		for (var x in lcc[prefix]){
			if (lcc[prefix][x].parents.length < leastParents){
				use = lcc[prefix][x].id
				leastParents = lcc[prefix][x].parents.length
			}
		}


		return use

	}else{
		return false
	}
		

}



exports.coarseLCC = function(mark,lcc){


	mark = mark.replace('[','').replace(']','').toUpperCase().replace(/\s+/,'')



	//strip down the LCC class mark to the prefix and numerical value
	var m = coarseLCCRegExDecimal.exec(mark)

	if (m===null) m = coarseLCCRegExNoDecimal.exec(mark)


	if (m===null) return false


	var prefix = m[1]
	var number = parseFloat(m[2])


	var r = exports.coarseLCCLocate(prefix,number,lcc)

	if (r) return r

	//go very coarse if we could not find a match
	r = exports.extraCoarseLCCLocate(prefix,number,lcc)
	

	return r


}

exports.parseLCC = function(cb){

	fs.readFile(__dirname + "/data/lcc_outlines.json", 'utf8', function (err, data) {

		if (err) throw err;

		var json = JSON.parse(data);

		cb(json)

	})

}


exports.parseLocationFile = function(cb){

	var locations = {}

	var stream = fs.createReadStream(__dirname + "/data/locations.csv")

	var csvStream = csv()
		.on("data", function(data){
	 		locations[data[0]] = {
	 			name : data[1],
	 			location : data[2],
	 			code : data[3],
	 			slug : data[4],
	 			lat : data[5],
	 			lng : data[6],
	 			research : data[7].toLowerCase()
	 		}
		})
		.on("end", function(){

			cb(locations)
		})

	stream.pipe(csvStream);

}

exports.isResearchBib = function(bib){


	//Bibcode 3 check
	//first check if it is bookset (e)
	if (bib.fixedFields){
		if (bib.fixedFields['31']){
			if (bib.fixedFields['31'].value){
				if (bib.fixedFields['31'].value === 'e') return false
			}
		}
	}

	//bib level
	//archives (7)
	//collection (c)
	//subunit (d)
	//include
	if (bib.bibLevel.code){
		if (['7','c','d'].indexOf(bib.bibLevel.code) > -1) return true

	}

	var line = JSON.stringify(bib).replace(/\s/g, "") 

	//do a broad reject of the records that have branch shelf locators
	if (line.search('"marcTag":"091"')>-1){
		//only if it does not have a resarch call number
		if (line.search('"marcTag":"852"')>-1){
			return true
		}else{
			return false
		}
	}

	//reject the dewey
	if (line.search('"marcTag":"082"')>-1){
		//only if it does not have a resarch call number
		if (line.search('"marcTag":"852"')>-1){
			return true
		}else{
			return false
		}
	}


	//okay, dunno, I guess it should go in
	return true



} 

exports.isResearchLocation = function(locations,allLocations){

	//if no codes then maybe
	if (locations.length === 0) return 'maybe'

	//we have strings here becuase we can have a 3rd maybe option
	var returnVal = 'false'

	for (var l in locations){

		if (allLocations[locations[l]]){
			if (allLocations[locations[l]].research === 'true'){
				returnVal = 'true'
				break
			}
		}

		if (allLocations[locations[l]]){
			if (allLocations[locations[l]].research === 'maybe'){
				returnVal = 'maybe'
			}
		}

	}


	return returnVal



}



exports.checkBibUpdateTime = function(returnTimeOnly){

	var runWindow = config['BibUpdate']['runWindow']
	var date = new Date()
	var currentHour = date.getHours()

	if (returnTimeOnly) return (runWindow)

	if (runWindow.indexOf(parseInt(currentHour)) == -1 ){
		return false
	}else{
		return true
	}

}

exports.checkItemUpdateTime = function(returnTimeOnly){

	var runWindow = config['ItemUpdate']['runWindow']
	var date = new Date()
	var currentHour = date.getHours()

	if (returnTimeOnly) return (runWindow)

	if (runWindow.indexOf(parseInt(currentHour)) == -1 ){
		return false
	}else{
		return true
	}

}


//check for the filename of the script running in ps aux output and return true if it is already listed
exports.checkIfRunning = function(cb,threshold){

	//on linux servers running this as a cron job it will be 3
	if (!threshold) threshold = 3

	var scriptName = process.argv[1].split("/")[process.argv[1].split("/").length-1]

	var child = exec("ps aux",
		function (error, stdout, stderr) {

			if (stdout.split(scriptName).length > threshold){
				cb(true)
			}else{
				cb(false)
			}
	})

}

//our own exit method to kill the process but allow the logger to finish up anything it is doing
exports.exit = function(){
	setTimeout(function(){process.exit()},2000)
}





exports.cleanClassMark = function(classmark){

	var classmark2 = false
	var og = classmark

	//remove the ++++ size flags
	classmark = classmark.replace(/\+/g,'')
	//remove the reserved (s) flag
	classmark = classmark.replace(/\(s\)/gi,'')
	classmark = classmark.replace(/\[s\]/gi,'')


	// (c.r) ?
	classmark = classmark.replace(/\(\s*C\.\s*R\.\s*\)/gi,'')

	// (Parsons)
	classmark = classmark.replace(/\(Parsons\)/gi,'')
	// remove forwardslash
	classmark = classmark.replace(/\//gi,' ')
	// remove backslash
	classmark = classmark.replace(/\\/gi,' ')

	// ⁽ ? ₊
	classmark = classmark.replace('⁽','')
	classmark = classmark.replace('₊','')


	classmark = classmark.replace('X*','*')



	//a bunch of embdeded billings
	classmark = classmark.replace(/\(APV\)/,'APV ')
	classmark = classmark.replace(/\(KAA\)/,'KAA ')
	classmark = classmark.replace(/\(AN\)/,'AN ')
	classmark = classmark.replace(/\(\*QVA/,'*QVA (')
	classmark = classmark.replace(/\(NPM /,'NPM (')
	classmark = classmark.replace(/\(COB/,'COB ')
	classmark = classmark.replace(/\(SIVI /,'SIVI ')
	classmark = classmark.replace(/\(SB /,'SB ')
	classmark = classmark.replace(/\(SIV /,'SIV (')
	classmark = classmark.replace(/\(\*SYA /,'*SYA (')
	classmark = classmark.replace(/\(\*KF /,'*KF (')
	classmark = classmark.replace(/\(HDY/,'HDY (')
	classmark = classmark.replace(/\(TIB/,'TIB ')
	classmark = classmark.replace(/\(QOA/,'QOA ')
	classmark = classmark.replace(/\(DOC/,'DOC ')
	classmark = classmark.replace(/\(VWZW/,'VWZW ')
	classmark = classmark.replace(/\(ZISA/,'ZISA ')
	classmark = classmark.replace(/\(\*RB\-IGA\)/,'*RB-IGA ')
	classmark = classmark.replace(/\(\*QPA\)/,'*QPA (')
	classmark = classmark.replace(/\(DF/,'DF (')
	classmark = classmark.replace(/\(BMS/,'BMS (')
	classmark = classmark.replace(/\((1041A)\)/,'')
	classmark = classmark.replace(/^J\s/,'')

	classmark = classmark.trim()

	//if it is microfilm try to get possible secondary classmark

	if (classmark.search(/^\*Z[A-Z]*\-/) > -1){
		//we need to pull embeded second mark like *ZAN-*MP87 or *ZAN-V1169
		var complex = classmark.match(/^\*Z[A-Z]*\-\**[A-Z]+/)

		if (complex){
			classmark = complex[0].split('-')[0].trim()
			classmark2 = complex[0].split('-')[1].trim()
		}else{

			var leftovers = classmark.split('-')[1]
			classmark = classmark.split('-')[0].trim()
			if (leftovers.search(/\s\**[A-Z]+\s/) > -1){
				classmark2 = leftovers.match(/\s\**[A-Z]+\s/)[0].trim()
			}

		}
		return [classmark,classmark2]
	}



	

	if (classmark.search(/(\*R-USLHG\s+\**[A-Z]+)/i) > -1){

		return [classmark.match(/(\*R-USLHG\s+\**[A-Z]+)/i)[1]]
	}


	if (classmark.search(/\*MGZM\-Res/i) > -1){

		return ['*MGZM-Res']
	}


	if (classmark.search(/Desk/i) > -1 && classmark.search(/Slav/i) > -1 && classmark.search(/Div/i) > -1){
		return ['Desk-Slav. Div.']
	}


	//if it is a milstine
	if (classmark.search(/NYGB Map Div\.*/i) > -1){

		return ['NYGB Map Div.']
	}
	if (classmark.search(/NYGB Col/i) > -1){

		return ['NYGB Col']
	}


	if (classmark.search(/Berg Col Auction/i) > -1){

		return ['Berg Col Auction']
	}
	if (classmark.search(/Berg Coll Cased/i) > -1){

		return ['Berg Coll Cased']
	}
	if (classmark.search(/Berg Coll Framed/i) > -1){

		return ['Berg Coll Framed']
	}
	if (classmark.search(/Berg Coll m\.b\./i) > -1){

		return ['Berg Coll m.b.']
	}
	if (classmark.search(/Berg Coll MSS/i) > -1){

		return ['Berg Coll MSS']
	}
	if (classmark.search(/Berg Coll Ref/i) > -1){

		return ['Berg Coll Ref']
	}

	if (classmark.search(/Berg\.* Coll\.*/i) > -1){

		return ['Berg Coll']
	}


	//if it is a milstine
	if (classmark.search("NYGB") > -1){
		classmark = classmark.split(" ")[0] + " " + classmark.split(" ")[1]
		return [classmark]
	}

	if (classmark.search(/READEX Microfiche/i) > -1){

		return ['READEX Microfiche']
	}
	

	//is it the 50's style fixed order
	if (classmark.search(/^[A-Z]\-[0-9][0-9]\s/) > -1){
		return [classmark.match(/^[A-Z]\-[0-9][0-9]\s/)[0].trim()]
	}

	

	//schomberg service center
	if (classmark.search(/Sc\sSer\.\s*\-[A-Z]/i) > -1){
		return [classmark.match(/Sc\sSer\.\s*\-[A-Z]/i)[0].trim()]
	}
	
	//*R-USLHG *ZAN
	if (classmark.search(/\*R\-USLHG \*ZAN/) > -1){
		return ['*R-USLHG','*ZAN']
	}



	//*R-Econ.
	if (classmark.search(/^\*R\-Econ\./) > -1){
		return ['*R-Econ.']
	}

	//*OKOA B.L1
	if (classmark.search(/^\*+[A-Z][A-Z]+\s[A-Z]/) > -1){
		return [classmark.match(/^\*+[A-Z][A-Z]+\s/)[0].trim()]
	}

	//*ER .R3585
	if (classmark.search(/^\*[A-Z]+\s\./) > -1){
		return [classmark.match(/^\*[A-Z]+\s/)[0].trim()]
	}

	//Berg Coll
	if (classmark.search(/Berg Coll/) > -1){

		classmark = classmark.replace(/\s\s/," ")
	}

	//Schomberg Coll
	if (classmark.search(/Sc\s+B\-/i) > -1){

		return ['Sc B']
	}


	if (classmark.search("Sc Micro") > -1){

		return ['Sc Micro']
	}
	if (classmark.search("Sc Audio ") > -1){

		if (classmark.match(/(Sc\sAudio\s.+?)\-/)){
			return [classmark.match(/(Sc\sAudio\s.+?)\-/)[1] ]
		}else{
			return "Sc Audio"
		}
	}
	if (classmark.search("Sc Map ") > -1){

		if (classmark.match(/(Sc\Map\s.+?)\-/i)){
			return [classmark.match(/(Sc\Map\s.+?)\-/)[1] ]
		}else{
			return "Sc Map"
		}
	}

	if (classmark.search(/Sc News/i) > -1){

		return ['Sc News']
	}
	if (classmark.search(/Sc Art Portfolio/i) > -1){

		return ['Sc Art Portfolio']
	}

	

	if (classmark.search(/Sc Photo/i) > -1){

		return ['Sc Photo']
	}
	if (classmark.search(/Sc Scores/i) > -1){

		return ['Sc Scores']
	}
	if (classmark.search(/Sc Art Posters/i) > -1){

		return ['Sc Art Posters']
	}

	if (classmark.search(/Sc Rare Fic/i) > -1){

		return ['Sc Rare Fic']
	}

	if (classmark.search(/Sc Fic/i) > -1){

		return ['Sc Fic']
	}

	if (classmark.search(/Sc Rare/i) > -1){

		return ['Sc Rare']
	}
	if (classmark.search(/ReCAP/i) > -1){

		return ['ReCAP']
	}


	

	//remove anthing after the parans
	if (classmark.search(/\(/) > -1) classmark = classmark.substr(0,classmark.search(/\(/))

	if (classmark.search(/\)/) > -1) classmark = classmark.substr(0,classmark.search(/\)/))

	if (classmark.search(/\[/) > -1) classmark = classmark.substr(0,classmark.search(/\[/))

	if (classmark.search(/\{/) > -1) classmark = classmark.substr(0,classmark.search(/\{/))


	//remove stuff after a *4567
	if (classmark.search(/\*[0-9]+/i) > -1) classmark = classmark.substr(0,classmark.search(/\*[0-9]+/i))


	//remove anything after a 'p.v.'
	if (classmark.search(/p\.\s*v\./i) > -1) classmark = classmark.substr(0,classmark.search(/p\.\s*v\./i))
	//remove anything after a 'n.c.'
	if (classmark.search(/n\.\s*c\./i) > -1) classmark = classmark.substr(0,classmark.search(/n\.\s*c\./i))
		
	//remove anything after a 'pv.'
	if (classmark.search(/\spv\./i) > -1) classmark = classmark.substr(0,classmark.search(/\spv\./i))
	//remove anything after a 'p.'
	if (classmark.search(/\sp\./i) > -1) classmark = classmark.substr(0,classmark.search(/\sp\./i))
	
	//remove anything after a 'p.'
	if (classmark.search(/\sp\.\s/i) > -1) classmark = classmark.substr(0,classmark.search(/\sp\.\s/i))


	//remove anything after a 'p.b.'
	if (classmark.search(/p\.\s*b\./i) > -1) classmark = classmark.substr(0,classmark.search(/p\.\s*b\./i))


	//remove anything after a 'n.'
	if (classmark.search(/\sn\.\./i) > -1) classmark = classmark.substr(0,classmark.search(/\sn\.\./i))
	if (classmark.search(/\sn\.c/i) > -1) classmark = classmark.substr(0,classmark.search(/\sn\.c/i))

	//remove anything after a 'v. '
	if (classmark.search(/\sv\.\s/i) > -1) classmark = classmark.substr(0,classmark.search(/\sv\.\s/i))


	//remove anything after a  ##
	if (classmark.search(/\s+[0-9][0-9]/) > -1) classmark = classmark.substr(0,classmark.search(/\s+[0-9][0-9]/))

	//remove anything after a 'kn.'
	if (classmark.search(/\skn\./i) > -1) classmark = classmark.substr(0,classmark.search(/\skn\./i))


	//remove anything after a ','
	if (classmark.search(/,/i) > -1) classmark = classmark.substr(0,classmark.search(/,/i))


	//remove anything after a -###
	if (classmark.search(/\-[0-9][0-9]/) > -1) classmark = classmark.substr(0,classmark.search(/\-[0-9][0-9]/))

	//remove anything after a \s[A-Z][0-9]
	if (classmark.search(/\s[A-Z]+[0-9]+/) > -1) classmark = classmark.substr(0,classmark.search(/\s[A-Z]+[0-9]+/))


	//it is a LCC mark
	if (classmark.search(/([A-Z]+)[0-9]+\./) > -1){
		
		//return [classmark.match(/(\**[A-Z]+)[0-9]+\./)[0].trim()]
		return [false]
	}

	//it is a LCC mark
	if (classmark.search(/[A-Z]+[0-9]+/) > -1){


		//*EC.D814 Ser.A, no. 9
		if (classmark.search(/\*[A-Z][A-Z]+\./) >-1 ){
			return [classmark.match(/\*[A-Z][A-Z]+/)[0] ]
		}

		//return false on the messed up or LC number
		return [false]

		//if ( classmark.search(/^\*[A-Z]+\s/) )
	
		//return [classmark.match(/(\**[A-Z]+)[0-9]+\./)[0].trim()]
		//return [false]
		//console.log(("                                " + classmark).slice(-30), "|", og )
	}


	if (classmark.search(/\*R\-USLHG\s+\**[A-Z][A-Z]+/) > -1){
		return [classmark.split(' ')[0],classmark.split(' ')[1]]
	}

	//*XLM-2
	if (classmark.search(/\**[A-Z][A-Z]+\-[0-9]+/) > -1){
		return [classmark.split('-')[0]]
	}

	classmark = classmark.trim()

	//*LSMY 6-7
	if (classmark.split(" ").length > 1){
		var leftovers = classmark.split(" ")[1]

		leftovers = leftovers.replace(/\-/g,'')

		if (!isNaN(leftovers)){
			console.log (classmark.split(" ")[0],"|",classmark)
		}

	}

	if (classmark.toLowerCase() == 'def') classmark = "DEF"

	if (classmark.toLowerCase() == '*c') classmark = "*C"
	if (classmark.toLowerCase() == '*c-4') classmark = "*C-4"
	if (classmark.toLowerCase() == '*c 2') classmark = "*C-2"
	if (classmark.toLowerCase() == '*c-3') classmark = "*C-3"
	if (classmark == '*MGTY-Res') classmark = "*MGTY-Res."	
	if (classmark == '*OVk') classmark = "*OVK"	
	if (classmark == '*R-Pforz EDU *') classmark = "*R-Pforz EDU"	
	if (classmark == '*z') classmark = "*Z"	
	if (classmark == 'BAc') classmark = "BAC"	
	if (classmark == 'c') classmark = "C"	
	if (classmark == 'm. b.') classmark = "m.b."	
	if (classmark == 'g') classmark = "G"	

	if (classmark == 'Map div.') classmark = "Map Div."	
	if (classmark == 'Map Div') classmark = "Map Div."	
	if (classmark == 'Map. Div.') classmark = "Map Div."	

	if (classmark == 'Mss Div.') classmark = "Mss. Div."	
	if (classmark == 'MSS. DIV.') classmark = "Mss. Div."




	if (classmark == 'MUS. DIV.') classmark = "Mus. Div."	

	if (classmark == 'MUS. RES. *MEC') classmark = "Mus. Res. *MEC"	
	if (classmark == 'NYGB CT275') classmark = "NYGB CT"	

	if (classmark == 'NYGB GA') classmark = "NYGB GA."	
	if (classmark == 'NYGB IRELAND') classmark = "NYGB IRE."	
	if (classmark == 'QGf') classmark = "QGF"	
	if (classmark == 'STUART') classmark = "Stuart"	
	if (classmark == '*T-VIM') classmark = "*T-Vim"	
	if (classmark == '*GAH p .v.') classmark = "*GAH"	







	if (classmark == 'NYGB MARYLAND') classmark = "NYGB Maryland"	
	if (classmark == 'NYGB MASS') classmark = "NYGB MASS."	
	if (classmark == 'NYGB Mass.') classmark = "NYGB MASS."	
	if (classmark == 'NYGB MD') classmark = "NYGB MD."	
	if (classmark == 'NYGB N') classmark = "NYGB N."	
	if (classmark == 'NYGB N.Y.C') classmark = "NYGB N.Y.C."	
	if (classmark == 'P.S. War songs') classmark = "P.S. War Songs"	
	if (classmark == 'Per Div.') classmark = "Per. Div."	
	if (classmark == 'PRINTS') classmark = "PRINT"	
	if (classmark == 'Pub Cat.') classmark = "Pub. Cat."	
	if (classmark == 'Pub. Cat') classmark = "Pub. Cat."	
	if (classmark == 'PUB. CAT.') classmark = "Pub. Cat."	
	if (classmark == 'Pub. Cat. Div.') classmark = "Pub. Cat."	
	if (classmark == 'Re-CAP') classmark = "ReCAP"	
	if (classmark == 'Ref Cat.') classmark = "Ref. Cat."	
	if (classmark == 'Sc d') classmark = "Sc D"	
	if (classmark == 'Sc Mg') classmark = "Sc MG"	
	if (classmark == 'Sc Ser. -L') classmark = "Sc Ser.-L"	
	if (classmark == 'Sci. & Tech. Div.') classmark = "Sci. & Tech."	
	if (classmark == 'scp') classmark = "SCP"	
	if (classmark == 'sg') classmark = "SG"	
	if (classmark == 'SIBL.') classmark = "SIBL"	
	if (classmark == 'Slav.Reserve') classmark = "Slav. Reserve"	
	if (classmark == 'Spencer Coll.  Amer.') classmark = "Spencer Coll. Amer."	

	if (classmark == '*T Pho B') classmark = "*T-Pho B"	


	if (classmark == '*T Mss') classmark = "*T-MSS"	
	if (classmark == '*T- Mss') classmark = "*T-MSS"	

	if (classmark == 'Arents 4') classmark = "Arents"	
	if (classmark == 'Cased Mss.') classmark = "Cased Mss"	
	if (classmark == 'Map Div.11') classmark = "Map Div."	
	if (classmark == 'Map Div.12') classmark = "Map Div."	
	if (classmark == 'Map Div.14') classmark = "Map Div."	

	if (classmark == '*LQRX 3') classmark = "*LQRX"	
	if (classmark == '*LRXA.206') classmark = "*LRXA"	
	if (classmark == '*LRY 2') classmark = "*LRY"	
	if (classmark == '*LSMY 9') classmark = "*LSMY"	
	if (classmark == '*LT 5') classmark = "*LT"	
	if (classmark == '*MGRK - Res.') classmark = "*MGRK-Res."	
	if (classmark == '*MTK  box') classmark = "*MTK"	
	if (classmark == '*MX-Amer. box') classmark = "*MX-Amer."	
	if (classmark == '*MYD-Amer. box') classmark = "*MYD-Amer."	
	if (classmark == '*MYD-Amer. Paull') classmark = "*MYD-Amer."	
	if (classmark == "*PSI ‪") classmark = "*PSI"	
	if (classmark == "*PRH ‪") classmark = "*PRH"	
	if (classmark == "*PZX ‪10") classmark = "*PZX"	






	if (classmark.search(/\*MGZHB/i) > -1) classmark = '*MGZHB'
	if (classmark.search(/\*MGZIA/i) > -1) classmark = '*MGZIA'
	if (classmark.search(/\*MGZIDVD/i) > -1) classmark = '*MGZIDVD'
	if (classmark.search(/\*MGZMB\-Res/i) > -1) classmark = '*MGZMB-Res.'
	if (classmark.search(/\*MGZMC\-Res/i) > -1) classmark = '*MGZMC-Res.'
	if (classmark.search(/\*MGZMD/i) > -1) classmark = '*MGZMD'
	if (classmark.search(/\*MGZMT/i) > -1) classmark = '*MGZMT'
	if (classmark.search(/\*MGZT/i) > -1) classmark = '*MGZT'
	if (classmark.search(/\*MYD\s+box/i) > -1) classmark = '*MYD box'
	if (classmark.search(/\*MGZTL/i) > -1) classmark = '*MGZTL'
	if (classmark.search(/\*MGZTC/i) > -1) classmark = '*MGZTC'
	if (classmark.search(/\*R-Phono/i) > -1) classmark = '*R-Phono.'
	if (classmark.search(/\*R-SIBL/i) > -1) classmark = '*R-SIBL'
	if (classmark.search(/\*R-Slav\.*\s+Div\.*/i) > -1) classmark = '*R-Slav. Div.'
	if (classmark.search(/\*MGZTC/i) > -1) classmark = '*MGZTC'
	if (classmark.search(/\*MGZHC/i) > -1) classmark = '*MGZHC'
	if (classmark.search(/\*MGZI/i) > -1) classmark = '*MGZI'
	if (classmark.search(/\*MGZIB/i) > -1) classmark = '*MGZIB'
	if (classmark.search(/\*MGZIC/i) > -1) classmark = '*MGZIC'
	if (classmark.search(/\*MGZIDf/i) > -1) classmark = '*MGZIDF'
	if (classmark.search(/NCOX/i) > -1) classmark = 'NCOX'
	if (classmark.search(/\*MGZFB/i) > -1) classmark = '*MGZFB'

	if (classmark.search(/\*MGZRC/i) > -1) classmark = '*MGZRC'


	if (classmark.search(/\*R\sPforz\sENG/i) > -1) classmark = '*R Pforz ENG'
	if (classmark.search(/\*R\sPforz\sENG/i) > -1) classmark = '*R Pforz ENG'
	if (classmark.search(/\*R\sPforz\sITA/i) > -1) classmark = '*R Pforz ITA'

	if (classmark.search(/\*R\-Art\sDesk/i) > -1) classmark = '*R-Art Desk'

	if (classmark.search(/\*T\-LC/i) > -1) classmark = '*T-LC'


	classmark = classmark.trim()

	//problems with capilization
	if ((classmark.charAt(0).toLowerCase() == 'j' || classmark.charAt(0).toLowerCase() == 'i') && classmark.length<5) classmark = classmark.toUpperCase()

	if (classmark.charAt(classmark.length-1) == '-') classmark = classmark.split('-')[0]


	if (!isNaN(classmark)) return false

	//console.log(classmark)

	//console.log(("                                " + classmark).slice(-30), "|", og )

	return [classmark]
}




exports.extractScIdentifiers = function(bib){

	if (typeof bib === 'string'){
		var line = bib
		bib = JSON.parse(bib)
	}else{
		var line = JSON.stringify(bib)
	}

	var oclcNumbers = [], isbnNumbers = [], issnNumbers = [], possibleOclc = []
	var title = false, author = false
	var lineMatch = line.match(oclcRegExp)

	for (var x in lineMatch){
		x = lineMatch[x]
		if (x.search("fst") == -1 && x.search("FST") == -1){
			//clean it up
			var o = x.toLowerCase().replace('(ocolc)','').replace('"','')
			o=o.replace(/\s/g,'').replace(/\D/g,'')
			o=parseInt(o)
			if (!isNaN(o) && oclcNumbers.indexOf(o) === -1) oclcNumbers.push( o )
		}
	}


	//do we not have it yet
	var f001 = false, f003 = false, title = false, f020 = false

	//loop throguh the varfields and store what we need
	for (var x in bib.varFields){
		x = bib.varFields[x]
		if (x.marcTag == '001') f001 = x.content
		if (x.marcTag == '003') f003 = x.content


		if (x.marcTag == '022'){
			var a = false
			for (var subfield in x.subfields){
				subfield = x.subfields[subfield]
				if (subfield.tag == 'a') a = subfield.content
			}
			if (a){
				issnNumbers.push(a)
			}



		}

		if (x.marcTag == '020'){

			var a = false

			for (var subfield in x.subfields){
				subfield = x.subfields[subfield]

				if (subfield.tag == 'a') a = subfield.content
			}

			if (a){
				try{
					a = a.match(/\d+/)[0]
					if (!isNaN(a) && isbnNumbers.indexOf(a) === -1) isbnNumbers.push(a)
				}catch (e) {
					//no numbers present...
				}
			}

		}

		if (x.marcTag == '245'){
			var a = "", n = "", b =""

			//build the title from $a + $n + $b
			for (var subfield in x.subfields){
				subfield = x.subfields[subfield]

				if (subfield.tag == 'a') a = subfield.content
				if (subfield.tag == 'n') n = subfield.content
				if (subfield.tag == 'b') b = subfield.content

			}
			title = a + " " + n + b
		}

		//look in the 9xx fields we sometimes store oclc numbers in $y
		if (x.marcTag){
			if (x.marcTag.charAt(0) == '9'){


				for (var subfield in x.subfields){
					subfield = x.subfields[subfield]

					if (subfield.content && subfield.tag){
						if (!isNaN(subfield.content) && subfield.tag == 'y'){
							oclcNumbers.push(subfield.content)
						}
					}

				}




			}
		}


	}

	if (f003 && f001){
		if (f003.toLowerCase() == 'ocolc'){

			//pull out the numbers from the string
			try{
				var oclcNumber = f001.match(/\d+/)[0]
				oclcNumber=oclcNumber.replace(/\s/g,'').replace(/\D/g,'')
				oclcNumber=parseInt(oclcNumber)
				if (!isNaN(oclcNumber) && oclcNumbers.indexOf(oclcNumber) === -1) oclcNumbers.push(oclcNumber )

			}catch (e) {
				//no numbers present...
				console.log("\n")
				console.log("weird OCLC:",f001)
			}

		}
	}

	if (f001){

		if (!isNaN(f001)){
			if (oclcNumbers.indexOf(f001.toString().trim()) == -1){
				possibleOclc.push(f001.toString().trim())
			}
		}

	}



	if (oclcNumbers.length == 0 && possibleOclc.length > 0){

		for (var x in possibleOclc){
			x = possibleOclc[x]
			x
			x=x.replace(/\s/g,'').replace(/\D/g,'')
			x=parseInt(x)
			if (!isNaN(x) && oclcNumbers.indexOf(x) === -1) oclcNumbers.push(x )

		}


	}


	var record = {
		oclc: oclcNumbers,
		isbn: isbnNumbers,
		issn: issnNumbers
	}

	return record


}


