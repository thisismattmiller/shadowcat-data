var config = require("config")
var fs = require("fs")
var csv = require("fast-csv")
var removeDiacritics = require('diacritics').remove
var pluralize = require('pluralize')
require("string_score")

var exec = require('child_process').exec

var exports = module.exports = {};

var coarseLCCRegExDecimal = new RegExp("^([A-Z]+)([0-9]+\.[0-9]+)")
var coarseLCCRegExNoDecimal = new RegExp("^([A-Z]+)([0-9]+)")
var oclcRegExp = new RegExp(/\(ocolc\).*?"/ig)

var arevAgentRegex = /I\.\s|\sI\.|II\.\s|\sII\.|III\.\s|\sIII\.|IV\.\s|\sIV\.|V\.\s|\sV\.|VI\.\s|\sVI\.|VII\.\s|\sVII\.|VIII\.\s|\sVIII\.|IX\.\s|\sIX\.|X\.\s|\sX\.|XI\.\s|\sXI\.|XII\.\s|\sXII\.|XIII\.\s|\sXIII\.|XIV\.\s|\sXIV\.|XV\.\s|\sXV\.|XVI\.\s|\sXVI\.|XVII\.\s|\sXVII\.|XVIII\.\s|\sXVIII\.|XIX\.\s|\sXIX\.|XX\.\s|\sXX\.|XXI\.\s|\sXXI\.|XXII\.\s|\sXXII\.|XXIII\.\s|\sXXIII\.|XXIV\.\s|\sXXIV\.|XXV\.\s|\sXXV\.|XXVI\.\s|\sXXVI\.|XXVII\.\s|\sXXVII\.|XXVIII\.\s|\sXXVIII\.|XXIX\.\s|\sXXIX\.|XXX\.\s|\sXXX\.|XXXI\.\s|\sXXXI\.|XXXII\.\s|\sXXXII\.|XXXIII\.\s|\sXXXIII\.|XXXIV\.\s|\sXXXIV\.|XXXV\.\s|\sXXXV\.|XXXVI\.\s|\sXXXVI\.|XXXVII\.\s|\sXXXVII\.|XXXVIII\.\s|\sXXXVIII\.|XXXIX\.\s|\sXXXIX\.|XL\.\s|\sXL\.|XLI\.\s|\sXLI\.|XLII\.\s|\sXLII\.|XLIII\.\s|\sXLIII\.|XLIV\.\s|\sXLIV\.|XLV\.\s|\sXLV\.|XLVI\.\s|\sXLVI\.|XLVII\.\s|\sXLVII\.|XLVIII\.\s|\sXLVIII\.|XLIX\.\s/g
var arevSubjectRegex = /1\.|2\.|3\.|4\.|5\.|6\.|7\.|8\.|9\.|10\.|11\.|12\.|13\.|14\.|15\.|16\.|17\.|18\.|19\.|20\.|21\.|22\.|23\.|24\.|25\.|26\.|27\.|28\.|29\.|30\.|31\.|32\.|33\.|34\.|35\.|36\.|37\.|38\.|39\.|40\.|41\.|42\.|43\.|44\.|45\.|46\.|47\.|48\.|49\./g

var arevNameTypical = /[A-Z][a-z]*,\s[A-Z]/
var arevNameYear = /,\s[0-9]{4}/


var Latinise={};Latinise.latin_map={"s︡":"s","t︠":"t","a︡":"a","u︡︠":"u","i︠":"i","Á":"A","Ă":"A","Ắ":"A","Ặ":"A","Ằ":"A","Ẳ":"A","Ẵ":"A","Ǎ":"A","Â":"A","Ấ":"A","Ậ":"A","Ầ":"A","Ẩ":"A","Ẫ":"A","Ä":"A","Ǟ":"A","Ȧ":"A","Ǡ":"A","Ạ":"A","Ȁ":"A","À":"A","Ả":"A","Ȃ":"A","Ā":"A","Ą":"A","Å":"A","Ǻ":"A","Ḁ":"A","Ⱥ":"A","Ã":"A","Ꜳ":"AA","Æ":"AE","Ǽ":"AE","Ǣ":"AE","Ꜵ":"AO","Ꜷ":"AU","Ꜹ":"AV","Ꜻ":"AV","Ꜽ":"AY","Ḃ":"B","Ḅ":"B","Ɓ":"B","Ḇ":"B","Ƀ":"B","Ƃ":"B","Ć":"C","Č":"C","Ç":"C","Ḉ":"C","Ĉ":"C","Ċ":"C","Ƈ":"C","Ȼ":"C","Ď":"D","Ḑ":"D","Ḓ":"D","Ḋ":"D","Ḍ":"D","Ɗ":"D","Ḏ":"D","ǲ":"D","ǅ":"D","Đ":"D","Ƌ":"D","Ǳ":"DZ","Ǆ":"DZ","É":"E","Ĕ":"E","Ě":"E","Ȩ":"E","Ḝ":"E","Ê":"E","Ế":"E","Ệ":"E","Ề":"E","Ể":"E","Ễ":"E","Ḙ":"E","Ë":"E","Ė":"E","Ẹ":"E","Ȅ":"E","È":"E","Ẻ":"E","Ȇ":"E","Ē":"E","Ḗ":"E","Ḕ":"E","Ę":"E","Ɇ":"E","Ẽ":"E","Ḛ":"E","Ꝫ":"ET","Ḟ":"F","Ƒ":"F","Ǵ":"G","Ğ":"G","Ǧ":"G","Ģ":"G","Ĝ":"G","Ġ":"G","Ɠ":"G","Ḡ":"G","Ǥ":"G","Ḫ":"H","Ȟ":"H","Ḩ":"H","Ĥ":"H","Ⱨ":"H","Ḧ":"H","Ḣ":"H","Ḥ":"H","Ħ":"H","Í":"I","Ĭ":"I","Ǐ":"I","Î":"I","Ï":"I","Ḯ":"I","İ":"I","Ị":"I","Ȉ":"I","Ì":"I","Ỉ":"I","Ȋ":"I","Ī":"I","Į":"I","Ɨ":"I","Ĩ":"I","Ḭ":"I","Ꝺ":"D","Ꝼ":"F","Ᵹ":"G","Ꞃ":"R","Ꞅ":"S","Ꞇ":"T","Ꝭ":"IS","Ĵ":"J","Ɉ":"J","Ḱ":"K","Ǩ":"K","Ķ":"K","Ⱪ":"K","Ꝃ":"K","Ḳ":"K","Ƙ":"K","Ḵ":"K","Ꝁ":"K","Ꝅ":"K","Ĺ":"L","Ƚ":"L","Ľ":"L","Ļ":"L","Ḽ":"L","Ḷ":"L","Ḹ":"L","Ⱡ":"L","Ꝉ":"L","Ḻ":"L","Ŀ":"L","Ɫ":"L","ǈ":"L","Ł":"L","Ǉ":"LJ","Ḿ":"M","Ṁ":"M","Ṃ":"M","Ɱ":"M","Ń":"N","Ň":"N","Ņ":"N","Ṋ":"N","Ṅ":"N","Ṇ":"N","Ǹ":"N","Ɲ":"N","Ṉ":"N","Ƞ":"N","ǋ":"N","Ñ":"N","Ǌ":"NJ","Ó":"O","Ŏ":"O","Ǒ":"O","Ô":"O","Ố":"O","Ộ":"O","Ồ":"O","Ổ":"O","Ỗ":"O","Ö":"O","Ȫ":"O","Ȯ":"O","Ȱ":"O","Ọ":"O","Ő":"O","Ȍ":"O","Ò":"O","Ỏ":"O","Ơ":"O","Ớ":"O","Ợ":"O","Ờ":"O","Ở":"O","Ỡ":"O","Ȏ":"O","Ꝋ":"O","Ꝍ":"O","Ō":"O","Ṓ":"O","Ṑ":"O","Ɵ":"O","Ǫ":"O","Ǭ":"O","Ø":"O","Ǿ":"O","Õ":"O","Ṍ":"O","Ṏ":"O","Ȭ":"O","Ƣ":"OI","Ꝏ":"OO","Ɛ":"E","Ɔ":"O","Ȣ":"OU","Ṕ":"P","Ṗ":"P","Ꝓ":"P","Ƥ":"P","Ꝕ":"P","Ᵽ":"P","Ꝑ":"P","Ꝙ":"Q","Ꝗ":"Q","Ŕ":"R","Ř":"R","Ŗ":"R","Ṙ":"R","Ṛ":"R","Ṝ":"R","Ȑ":"R","Ȓ":"R","Ṟ":"R","Ɍ":"R","Ɽ":"R","Ꜿ":"C","Ǝ":"E","Ś":"S","Ṥ":"S","Š":"S","Ṧ":"S","Ş":"S","Ŝ":"S","Ș":"S","Ṡ":"S","Ṣ":"S","Ṩ":"S","Ť":"T","Ţ":"T","Ṱ":"T","Ț":"T","Ⱦ":"T","Ṫ":"T","Ṭ":"T","Ƭ":"T","Ṯ":"T","Ʈ":"T","Ŧ":"T","Ɐ":"A","Ꞁ":"L","Ɯ":"M","Ʌ":"V","Ꜩ":"TZ","Ú":"U","Ŭ":"U","Ǔ":"U","Û":"U","Ṷ":"U","Ü":"U","Ǘ":"U","Ǚ":"U","Ǜ":"U","Ǖ":"U","Ṳ":"U","Ụ":"U","Ű":"U","Ȕ":"U","Ù":"U","Ủ":"U","Ư":"U","Ứ":"U","Ự":"U","Ừ":"U","Ử":"U","Ữ":"U","Ȗ":"U","Ū":"U","Ṻ":"U","Ų":"U","Ů":"U","Ũ":"U","Ṹ":"U","Ṵ":"U","Ꝟ":"V","Ṿ":"V","Ʋ":"V","Ṽ":"V","Ꝡ":"VY","Ẃ":"W","Ŵ":"W","Ẅ":"W","Ẇ":"W","Ẉ":"W","Ẁ":"W","Ⱳ":"W","Ẍ":"X","Ẋ":"X","Ý":"Y","Ŷ":"Y","Ÿ":"Y","Ẏ":"Y","Ỵ":"Y","Ỳ":"Y","Ƴ":"Y","Ỷ":"Y","Ỿ":"Y","Ȳ":"Y","Ɏ":"Y","Ỹ":"Y","Ź":"Z","Ž":"Z","Ẑ":"Z","Ⱬ":"Z","Ż":"Z","Ẓ":"Z","Ȥ":"Z","Ẕ":"Z","Ƶ":"Z","Ĳ":"IJ","Œ":"OE","ᴀ":"A","ᴁ":"AE","ʙ":"B","ᴃ":"B","ᴄ":"C","ᴅ":"D","ᴇ":"E","ꜰ":"F","ɢ":"G","ʛ":"G","ʜ":"H","ɪ":"I","ʁ":"R","ᴊ":"J","ᴋ":"K","ʟ":"L","ᴌ":"L","ᴍ":"M","ɴ":"N","ᴏ":"O","ɶ":"OE","ᴐ":"O","ᴕ":"OU","ᴘ":"P","ʀ":"R","ᴎ":"N","ᴙ":"R","ꜱ":"S","ᴛ":"T","ⱻ":"E","ᴚ":"R","ᴜ":"U","ᴠ":"V","ᴡ":"W","ʏ":"Y","ᴢ":"Z","á":"a","ă":"a","ắ":"a","ặ":"a","ằ":"a","ẳ":"a","ẵ":"a","ǎ":"a","â":"a","ấ":"a","ậ":"a","ầ":"a","ẩ":"a","ẫ":"a","ä":"a","ǟ":"a","ȧ":"a","ǡ":"a","ạ":"a","ȁ":"a","à":"a","ả":"a","ȃ":"a","ā":"a","ą":"a","ᶏ":"a","ẚ":"a","å":"a","ǻ":"a","ḁ":"a","ⱥ":"a","ã":"a","ꜳ":"aa","æ":"ae","ǽ":"ae","ǣ":"ae","ꜵ":"ao","ꜷ":"au","ꜹ":"av","ꜻ":"av","ꜽ":"ay","ḃ":"b","ḅ":"b","ɓ":"b","ḇ":"b","ᵬ":"b","ᶀ":"b","ƀ":"b","ƃ":"b","ɵ":"o","ć":"c","č":"c","ç":"c","ḉ":"c","ĉ":"c","ɕ":"c","ċ":"c","ƈ":"c","ȼ":"c","ď":"d","ḑ":"d","ḓ":"d","ȡ":"d","ḋ":"d","ḍ":"d","ɗ":"d","ᶑ":"d","ḏ":"d","ᵭ":"d","ᶁ":"d","đ":"d","ɖ":"d","ƌ":"d","ı":"i","ȷ":"j","ɟ":"j","ʄ":"j","ǳ":"dz","ǆ":"dz","é":"e","ĕ":"e","ě":"e","ȩ":"e","ḝ":"e","ê":"e","ế":"e","ệ":"e","ề":"e","ể":"e","ễ":"e","ḙ":"e","ë":"e","ė":"e","ẹ":"e","ȅ":"e","è":"e","ẻ":"e","ȇ":"e","ē":"e","ḗ":"e","ḕ":"e","ⱸ":"e","ę":"e","ᶒ":"e","ɇ":"e","ẽ":"e","ḛ":"e","ꝫ":"et","ḟ":"f","ƒ":"f","ᵮ":"f","ᶂ":"f","ǵ":"g","ğ":"g","ǧ":"g","ģ":"g","ĝ":"g","ġ":"g","ɠ":"g","ḡ":"g","ᶃ":"g","ǥ":"g","ḫ":"h","ȟ":"h","ḩ":"h","ĥ":"h","ⱨ":"h","ḧ":"h","ḣ":"h","ḥ":"h","ɦ":"h","ẖ":"h","ħ":"h","ƕ":"hv","í":"i","ĭ":"i","ǐ":"i","î":"i","ï":"i","ḯ":"i","ị":"i","ȉ":"i","ì":"i","ỉ":"i","ȋ":"i","ī":"i","į":"i","ᶖ":"i","ɨ":"i","ĩ":"i","ḭ":"i","ꝺ":"d","ꝼ":"f","ᵹ":"g","ꞃ":"r","ꞅ":"s","ꞇ":"t","ꝭ":"is","ǰ":"j","ĵ":"j","ʝ":"j","ɉ":"j","ḱ":"k","ǩ":"k","ķ":"k","ⱪ":"k","ꝃ":"k","ḳ":"k","ƙ":"k","ḵ":"k","ᶄ":"k","ꝁ":"k","ꝅ":"k","ĺ":"l","ƚ":"l","ɬ":"l","ľ":"l","ļ":"l","ḽ":"l","ȴ":"l","ḷ":"l","ḹ":"l","ⱡ":"l","ꝉ":"l","ḻ":"l","ŀ":"l","ɫ":"l","ᶅ":"l","ɭ":"l","ł":"l","ǉ":"lj","ſ":"s","ẜ":"s","ẛ":"s","ẝ":"s","ḿ":"m","ṁ":"m","ṃ":"m","ɱ":"m","ᵯ":"m","ᶆ":"m","ń":"n","ň":"n","ņ":"n","ṋ":"n","ȵ":"n","ṅ":"n","ṇ":"n","ǹ":"n","ɲ":"n","ṉ":"n","ƞ":"n","ᵰ":"n","ᶇ":"n","ɳ":"n","ñ":"n","ǌ":"nj","ó":"o","ŏ":"o","ǒ":"o","ô":"o","ố":"o","ộ":"o","ồ":"o","ổ":"o","ỗ":"o","ö":"o","ȫ":"o","ȯ":"o","ȱ":"o","ọ":"o","ő":"o","ȍ":"o","ò":"o","ỏ":"o","ơ":"o","ớ":"o","ợ":"o","ờ":"o","ở":"o","ỡ":"o","ȏ":"o","ꝋ":"o","ꝍ":"o","ⱺ":"o","ō":"o","ṓ":"o","ṑ":"o","ǫ":"o","ǭ":"o","ø":"o","ǿ":"o","õ":"o","ṍ":"o","ṏ":"o","ȭ":"o","ƣ":"oi","ꝏ":"oo","ɛ":"e","ᶓ":"e","ɔ":"o","ᶗ":"o","ȣ":"ou","ṕ":"p","ṗ":"p","ꝓ":"p","ƥ":"p","ᵱ":"p","ᶈ":"p","ꝕ":"p","ᵽ":"p","ꝑ":"p","ꝙ":"q","ʠ":"q","ɋ":"q","ꝗ":"q","ŕ":"r","ř":"r","ŗ":"r","ṙ":"r","ṛ":"r","ṝ":"r","ȑ":"r","ɾ":"r","ᵳ":"r","ȓ":"r","ṟ":"r","ɼ":"r","ᵲ":"r","ᶉ":"r","ɍ":"r","ɽ":"r","ↄ":"c","ꜿ":"c","ɘ":"e","ɿ":"r","ś":"s","ṥ":"s","š":"s","ṧ":"s","ş":"s","ŝ":"s","ș":"s","ṡ":"s","ṣ":"s","ṩ":"s","ʂ":"s","ᵴ":"s","ᶊ":"s","ȿ":"s","ɡ":"g","ᴑ":"o","ᴓ":"o","ᴝ":"u","ť":"t","ţ":"t","ṱ":"t","ț":"t","ȶ":"t","ẗ":"t","ⱦ":"t","ṫ":"t","ṭ":"t","ƭ":"t","ṯ":"t","ᵵ":"t","ƫ":"t","ʈ":"t","ŧ":"t","ᵺ":"th","ɐ":"a","ᴂ":"ae","ǝ":"e","ᵷ":"g","ɥ":"h","ʮ":"h","ʯ":"h","ᴉ":"i","ʞ":"k","ꞁ":"l","ɯ":"m","ɰ":"m","ᴔ":"oe","ɹ":"r","ɻ":"r","ɺ":"r","ⱹ":"r","ʇ":"t","ʌ":"v","ʍ":"w","ʎ":"y","ꜩ":"tz","ú":"u","ŭ":"u","ǔ":"u","û":"u","ṷ":"u","ü":"u","ǘ":"u","ǚ":"u","ǜ":"u","ǖ":"u","ṳ":"u","ụ":"u","ű":"u","ȕ":"u","ù":"u","ủ":"u","ư":"u","ứ":"u","ự":"u","ừ":"u","ử":"u","ữ":"u","ȗ":"u","ū":"u","ṻ":"u","ų":"u","ᶙ":"u","ů":"u","ũ":"u","ṹ":"u","ṵ":"u","ᵫ":"ue","ꝸ":"um","ⱴ":"v","ꝟ":"v","ṿ":"v","ʋ":"v","ᶌ":"v","ⱱ":"v","ṽ":"v","ꝡ":"vy","ẃ":"w","ŵ":"w","ẅ":"w","ẇ":"w","ẉ":"w","ẁ":"w","ⱳ":"w","ẘ":"w","ẍ":"x","ẋ":"x","ᶍ":"x","ý":"y","ŷ":"y","ÿ":"y","ẏ":"y","ỵ":"y","ỳ":"y","ƴ":"y","ỷ":"y","ỿ":"y","ȳ":"y","ẙ":"y","ɏ":"y","ỹ":"y","ź":"z","ž":"z","ẑ":"z","ʑ":"z","ⱬ":"z","ż":"z","ẓ":"z","ȥ":"z","ẕ":"z","ᵶ":"z","ᶎ":"z","ʐ":"z","ƶ":"z","ɀ":"z","ﬀ":"ff","ﬃ":"ffi","ﬄ":"ffl","ﬁ":"fi","ﬂ":"fl","ĳ":"ij","œ":"oe","ﬆ":"st","ₐ":"a","ₑ":"e","ᵢ":"i","ⱼ":"j","ₒ":"o","ᵣ":"r","ᵤ":"u","ᵥ":"v","ₓ":"x"};
String.prototype.latinise=function(){return this.replace(/[^A-Za-z0-9\[\] ]/g,function(a){return Latinise.latin_map[a]||a})};
String.prototype.latinize=String.prototype.latinise;
String.prototype.isLatin=function(){return this==this.latinise()}


var combiningDiacritics = /[\u0300-\u036F\uFE20-\uFE2F\u20D0-\u20FF\u1DC0-\u1DFF\u1AB0-\u1AFF\u0300-\u036F\u02B0-\u02FF]/gi
var nonAscii = /[^\x00-\x7F]/g

exports.normalizeAndDiacritics = function(str){

	if (typeof str != "string") return ""

	str = str.replace(combiningDiacritics,"")
	
	str = removeDiacritics(str.toLowerCase().replace(/[.,-\/#!$%\^&\*;:{}=ʻ̲̣_’\+\\\|@`~<>()\[\]\"\-\'\?]/g,' ')).replace(/\sand\s/,' ').replace(/\s\s+/g, ' ').trim().latinize()

	str = str.replace(nonAscii,"")

	return str

}

exports.singularize = function(str){

	var words = str.split(" ")

	for (var x in words){
		words[x] = pluralize.singular(words[x])
	}

	return words.join(" ")


}


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


var termPartSubcodeTerms = ['a','v','x','y','z']
var checkFieldsTerms = ['648','650','651','653','655', '690']

var checkFieldsTermsGeneralSubDivisions = ['600','610','611','700','710','711']

var termsFieldTypeLookup = {
	"648a" : "terms:Chronological",
	"650a" : "terms:Topical",
	"650v" : "terms:FormGenre",
	"650x" : "terms:Topical",
	"650y" : "terms:Chronological",
	"650z" : "terms:Geographic",
	"651a" : "terms:Geographic",
	"651v" : "terms:FormGenre",
	"651x" : "terms:Topical",
	"651y" : "terms:Chronological",
	"651z" : "terms:Geographic",
	"653a" : "terms:Topical",
	"655a" : "terms:FormGenre",
	"655v" : "terms:FormGenre",
	"655x" : "terms:Topical",
	"655y" : "terms:Chronological",
	"655z" : "terms:Geograhpic",
	"690a" : "terms:Topical",
 	}


exports.returnTerms = function(bib){

	var terms = [], termsIndex = [], termsTypeLookup = {}


	//first extract all the subject heading fields we are going to use
	if (bib.varFields){

		for (var field in bib.varFields){


			field = bib.varFields[field]
			//100, 110, 111
			//700, 710, 711

			if (field.marcTag){
				if (checkFieldsTerms.indexOf(field.marcTag) > -1){

					if (field.subfields){

						for (var subfield in field.subfields){

							subfield = field.subfields[subfield]

							if (subfield.tag){
								if (termPartSubcodeTerms.indexOf(subfield.tag) > -1){
									if (subfield.content){
										var normal = exports.singularize(exports.normalizeAndDiacritics(subfield.content))
										if (termsIndex.indexOf(normal) == -1){
											terms.push(subfield.content)
											termsIndex.push(normal)
											termsTypeLookup[subfield.content] = termsFieldTypeLookup[field.marcTag + subfield.tag]
											//console.log(field.marcTag + subfield.tag, termsFieldTypeLookup[(field.marcTag.toString() + subfield.tag) ])

										}
									}
								}
							}

							



						}


					}

				}else if (checkFieldsTermsGeneralSubDivisions.indexOf(field.marcTag) > -1){

					//we want to check $x of these
					if (field.subfields){

						for (var subfield in field.subfields){

							subfield = field.subfields[subfield]

							if (subfield.tag){
								if (subfield.tag == "x"){
									if (subfield.content){
										var normal = exports.singularize(exports.normalizeAndDiacritics(subfield.content))
										if (termsIndex.indexOf(normal) == -1){
											terms.push(subfield.content)
											termsIndex.push(normal)
											//console.log(">>>>>>>>>",subfield.content)
											termsTypeLookup[subfield.content] = 'terms:Topical'
											//console.log(field.marcTag + subfield.tag, termsFieldTypeLookup[(field.marcTag.toString() + subfield.tag) ])

										}
									}
								}
								if (subfield.tag == "v"){
									if (subfield.content){
										var normal = exports.singularize(exports.normalizeAndDiacritics(subfield.content))
										if (termsIndex.indexOf(normal) == -1){
											terms.push(subfield.content)
											termsIndex.push(normal)
											//console.log(">>>>>>>>>",subfield.content)
											termsTypeLookup[subfield.content] = 'terms:FormGenre'
											//console.log(field.marcTag + subfield.tag, termsFieldTypeLookup[(field.marcTag.toString() + subfield.tag) ])

										}
									}
								}


							}

							



						}


					}


				}

			}


		}


	}

	if (bib['wc:genre']){
		bib['wc:genre'].map(function(t){
			var normal = exports.singularize(exports.normalizeAndDiacritics(t))
			if (termsIndex.indexOf(normal) == -1)
				terms.push(t)			
		})
	}

	//now build all the FAST we know about to try to match to them
	var fasts = []
	var fastIdUsed = []

	if (bib['wc:aboutFast']){
		bib['wc:aboutFast'].map(function(t){
			if (fastIdUsed.indexOf(t.id) == -1)
				if (t.name){
					t.normal = exports.singularize(exports.normalizeAndDiacritics(t.name)) 
					fasts.push({ subject : t.name, id: t.id, normal: t.normal })
				}
		})
	}	
	if (bib['classify:aboutFast']){
		bib['classify:aboutFast'].map(function(t){
			if (fastIdUsed.indexOf(t.id) == -1)
				if (t.subject){
					t.normal = exports.singularize(exports.normalizeAndDiacritics(t.subject)) 
					fasts.push({ subject : t.subject, id: t.id, normal: t.normal })
				}
		})
	}	

	// console.log(terms)
	// console.log(fasts)


	//try to map the FAST to the local via string matching


	var hasDupe = true, threshold = 0.5, dupeCheckCount = 0

	

	while (hasDupe === true && dupeCheckCount < 11){

		var newTerms = []
		threshold = threshold + 0.1
		dupeCheckCount++
		hasDupe=false
		var usedFast = []


		terms.map(function(t){

			var bestMatch = false, bestScore = -100, bestSubject = ""
			var normal = exports.singularize(exports.normalizeAndDiacritics(t))

			fasts.map(function(ft){

				var score = normal.score(ft.normal,0.5)

				if (score > threshold){
					if (score > bestScore){
						bestScore = score
						bestMatch = ft.id
						bestSubject = ft.subject

					}
				}

			})

			if (bestMatch){

				newTerms.push({

					nameLocal: t,
					nameFast: bestSubject,
					fast: bestMatch,
					type: termsTypeLookup[t]

				})


			}else{
				newTerms.push({

					nameLocal: t,
					nameFast: false,
					fast: false,
					type: termsTypeLookup[t]

				})


			}

		})


		//check to make sure we did not use the same FAST twice
		var dupeCheck = {}

		newTerms.map(function(n){

			if (n.fast){
				usedFast.push(n.fast)
				if (dupeCheck[n.fast]){
					hasDupe=true
				}else{
					dupeCheck[n.fast] = true
				}
			}
		})

	}

	//add in any FAST that we did not match already

	fasts.map(function(f){
		if (usedFast.indexOf(f.id)==-1){
				newTerms.push({
					nameLocal: false,
					nameFast: f.subject,
					fast: f.id,
					type: false
				})
		}
	})

	// console.log(newTerms)
	// console.log(usedFast)
	// console.log(hasDupe,threshold)

	return newTerms


}


exports.arevParseNames = function(value,returnSubjects){

	if (!returnSubjects) returnSubjects = false

	//does it start off looking like a arev string
	if ( (value[0] === "1" && value[1] === '.') || (value[0] === "I" && value[1] === '.')  ){


		value = value.replace(/\-\-\-/g,'--')

		var nameArray = value.split(arevAgentRegex)


		var names = []


		nameArray.forEach(function(n){
			n = n.trim()
			//not a subject string, not a title string, and is not empty
			if (n.search(/^1\./) === -1 && n.search(/^2\./) === -1  && n.search(/title:/i) === -1 && n.length>0 && returnSubjects === false){

				//split off any name+title auths
				if (n.search(/\./i)>-1){
					if (n.split(".").length<4){
						n = n.split(".")[0]+"."
					}
				}

				//gots some comma problems
				n = n.replace(/,/g,', ')
				n = n.replace(/\s\s+/g, ' ')


				names.push(n)
			}else{
				if (n.search(/^1\./) > -1 || n.search(/^2\./) > -1){
					if (returnSubjects){
						names = n
					}
				}
			}
		})

		if (names.length==0&&returnSubjects) return false

		return names


	}else{

		//doesn't look like a AREV thing
		return false

	}




}


exports.arevParseSubjects = function(value){


	//start out by asking for the subjects from the person parser

	var subjects = exports.arevParseNames(value,true)

	if (!subjects) return false


	var subjectArray = subjects.split(arevSubjectRegex)

	var subjectsFiltered = []


	subjectArray.forEach(function(n){

		n = n.trim()

		if (n.search(/\sI\./)>-1){
			nSplit = n.split(/\sI\./)
			if (nSplit.length>1){
				n = nSplit[0]
			}else{
				n = ""
			}
		}else if (n.search(/^I\./)>-1){
			n = ""
		}


		if (n.length>0){
			subjectsFiltered.push(n)
		}
	})


	var faceted = []

	subjectsFiltered.forEach(function(s){
		s.split("--").forEach(function(ss){
			if (faceted.indexOf(ss)===-1) faceted.push(ss)
		})
	})


	return (faceted.length==0) ? false : faceted

}

exports.arevParseSubjectsDeName = function(subjectArray){



	var results = { subjects: [], names: []}

	if (!subjectArray) return results

	subjectArray.forEach(function(s){

		if (s.search(arevNameTypical) > -1 || s.search(arevNameTypical) > -1){
			results.names.push(s)
		}else{
			results.subjects.push(s)
		}


	})

	return results

}
