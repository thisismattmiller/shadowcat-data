var config = require("config")
var request = require('request');
var fs = require('fs')

var exports = module.exports = {};

exports.apiKey = false
exports.apiSecret = false
exports.apiBase = false




exports.setApi = function(level){
	if (level == 'prod'){
		exports.apiKey =  config['APIProd']['key']
		exports.apiSecret =  config['APIProd']['secret']
		exports.apiBase = config['APIProd']['base']
		exports.apiType = config['APIProd']['type']
	}else{
		exports.apiKey =  config['APITest']['key']
		exports.apiSecret =  config['APITest']['secret']
		exports.apiBase = config['APITest']['base']
		exports.apiType = config['APITest']['type']
	}
}


exports.authToken = function(cb){


	if (!exports.apiKey){
		console.log("Error: Prod/Test enviornment not set")
		cb(false)
		return false
	}

	//uses the basic auth method to ask for the token
	request.post(exports.apiBase + "token", {
			'auth': {
				'user': exports.apiKey,
				'pass': exports.apiSecret
		}
	},

	function (error, response, body) {

		if (!response){
			console.log("Error: Make sure you set the correct base path to the API.")
			cb(false)
			process.exit()
		}


		if(response.statusCode == 200){
			cb(JSON.parse(body)['access_token'])
		} else {
			console.log(response)
			console.log('error: '+ response.statusCode)
			cb(false)
		}
	})



}



exports.downloadRecent = function(timeStart,timeEnd,token,type,field,offset,cb){



	//build the URL we are only intrested in non-deleted records, all possible fields from this endpoint
	var url = exports.apiBase + type + "?" + field + "=[" + timeStart + "," + timeEnd + "]" + "&deleted=false"  + "&fields=default,fixedFields,varFields" + "&limit=50&offset="+offset   

	//use the bearer auth token
	request.get(url , {
			'auth': {
				'bearer': token
		}
	},

	function (error, response, body) {

	  console.log("Call:",url,error,response.statusCode,body.length)

      if(response.statusCode == 200){


      	//parse and send to the callback funtion
        var data = JSON.parse(body)
        data.url = url
        cb(data);

      }else if (response.statusCode == 404){

      	cb({"entries": [],"start": 0,"total": 0, "url": url});
      
      } else {


        console.log('error: '+ response.statusCode)
        console.log("URL:", url)
        console.log(body)

        console.log('last id:', id)
        process.exit()
      }
    })




}



//simply write the data passed to a file in the data dir
exports.saveData = function(data,type,cb){

		if (!type){
			type = ""
		}else{
			type = type + "_"
		}

		if (data['entries'][data['entries'].length-1]){
			filename = data['entries'][data['entries'].length-1]['id'] + ".json"
		}else{
			filename = Math.floor(Date.now() / 1000) + ".json"
		}


		fs.writeFile(__dirname + "/../data/" + type + filename, JSON.stringify(data), function(err) {
			if(err) {
				console.log("Error: could not write file")
				console.log(err)
			}

			if(cb) cb(err,__dirname + "/../data/" + type + filename)

		});


}

