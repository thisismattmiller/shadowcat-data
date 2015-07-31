var should = require('should')
var util = require("../lib/util.js");



describe('UTIL', function () {

	it('checkBibUpdateTime - it should return the time frame (int array) of the hours it is allowed to run the bib update', function () {
		util.checkBibUpdateTime().should.be.type('boolean')
		util.checkBibUpdateTime(true).should.be.type('object')
		util.checkBibUpdateTime(true).length.should.be.above(0)

	})
	it('checkItemUpdateTime - it should return the time frame (int array) of the hours it is allowed to run the item update', function () {
		util.checkItemUpdateTime().should.be.type('boolean')
		util.checkItemUpdateTime(true).should.be.type('object')
		util.checkItemUpdateTime(true).length.should.be.above(0)

	})

	it('checkIfRunning - check if the script name is already active in ps aux output', function (done) {
		util.checkIfRunning(function(isAlreadyRunning){

			//seting the threshold to zero
			isAlreadyRunning.should.equal(false)

			done()

		},0)


	})

	it('parseLocationFile - it should return the location data parsed', function (done) {

		util.parseLocationFile(function(locations){

			locations['wty'].name.should.equal('Westchester Square Young Adult')

			done()

		})





	})







})