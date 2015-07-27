var should = require('should')
var api = require("../lib/api.js");



describe('API', function () {

	it('setApi - it should set the api key seceret and base values based on requeted level - prod', function () {
		api.setApi('prod')
		api.apiKey.should.be.type('string')
		api.apiSecret.should.be.type('string')
		api.apiType.should.be.equal('prod')
	})

	it('setApi - it should set the api key seceret and base values based on requeted level - test', function () {
		api.setApi()
		api.apiKey.should.be.type('string')
		api.apiSecret.should.be.type('string')
		api.apiType.should.be.equal('test')
	})




	it('authToken - without setting the API level it should return false ', function (done) {

		//reset the API keys
		api.apiKey = false
		api.apiSecret = false
		api.apiType = false

		api.authToken(function(results){
			results.should.be.equal(false)
			done()
		})
	})

	this.timeout(30000);

	//REQUIRES API credentails to be filled out
	it('authToken - using the test sever it should return a token (REQUIRES API CREDENTIALS) ', function (done) {
		//set API keys
		api.setApi('test')
		api.authToken(function(results){
			results.should.be.type('string')
			done()
		})
	})

	

	//REQUIRES API credentails to be filled out
	it('downloadRecent - using the test sever it should return records from a requested date (REQUIRES API CREDENTIALS) ', function (done) {
		//set API keys
		api.setApi('test')

		api.authToken(function(token){


			api.downloadRecent("2014-01-01T00:00:00Z","2014-01-01T23:59:59Z",token,'items','createdDate',0,function(results){

				results.entries.should.be.type('object')
				results.total.should.be.type('number')
				results.start.should.be.type('number')
				results.url.should.be.type('string')
				results.entries.length.should.be.above(0)

				done()

			});



		})
	})


	this.timeout(1000);

	//REQUIRES API credentails to be filled out
	it('saveData - save a response to file', function (done) {

		var test = { entries : [{id:1234567890},{id:999999999}], total : 2, start: 2}
		api.saveData(test,'test',function(err,filename){
			var fs = require('fs')
			//see if the file is there and delete
			var r = fs.unlinkSync(filename)
			done()
		});
	})






})