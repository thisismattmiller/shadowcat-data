var should = require('should')
var db = require("../lib/db.js");



describe('DB', function () {

	this.timeout(1000)


	before(function(done) {	
		db.testOverride = true
		db.dropTestCollection(function(err,result){
			done()
		})
	})


	it('createBaseMetadata - create baseline metadata with a specifc date (NEED DB CONNECTION)', function (done) {

		db.testOverride = true

		db.createBaseMetadata("2015-01-01",function(results){
			results.ops[0].bibLastUpdatedDate.should.equal('2015-01-01')
			results.ops[0].itemLastUpdatedDate.should.equal('2015-01-01')
			results.ops[0].bibLastUpdatedOffset.should.equal(0)
			results.ops[0].itemLastUpdatedOffset.should.equal(0)
			done()
		})
	})

	it('getMetadata - returns base metadata (NEED DB CONNECTION)', function (done) {
		db.testOverride = true
		db.getMetadata(function(err,results){
			results[0].bibLastUpdatedDate.should.equal('2015-01-01')
			results[0].itemLastUpdatedDate.should.equal('2015-01-01')
			results[0].bibLastUpdatedOffset.should.equal(0)
			results[0].itemLastUpdatedOffset.should.equal(0)
			done()
		})
	})

	it('updateBibMetadata - updates bib base metadata (NEED DB CONNECTION)', function (done) {
		db.testOverride = true
		db.updateBibMetadata('2015-02-02', 100, function(err,results){
			results.result.ok.should.equal(1)
			results.result.nModified.should.equal(1)
			results.result.n.should.equal(1)
			done()
		})
	})

	it('updateItemMetadata - updates item base metadata (NEED DB CONNECTION)', function (done) {
		db.testOverride = true
		db.updateItemMetadata('2015-02-02', 100, function(err,results){
			results.result.ok.should.equal(1)
			results.result.nModified.should.equal(1)
			results.result.n.should.equal(1)
			done()
		})
	})

	it('insertBibRecord - inset a bib record (NEED DB CONNECTION)', function (done) {
		var test = 	{ "_id" : 9999, "id" : 9999, "updatedDate" : "2015-05-23T07:22:03Z", "createdDate" : "2015-05-22T13:50:37Z", "deleted" : false, "suppressed" : false, "lang" : "No linguistic content", "title" : "Legend and finale in E flat", "author" : "Faulkes, William, 1863-1933.", "materialType" : { "code" : "c", "value" : "SCORE" }, "bibLevel" : { "code" : "m", "value" : "MONOGRAPH" }, "publishYear" : 1899, "catalogDate" : "2015-05-22", "country" : "England", "fixedFields" : { "24" : { "label" : "Language", "value" : "zxx", "display" : "No linguistic content" }, "25" : { "label" : "Skip", "value" : "0" }, "26" : { "label" : "Location", "value" : "mym  ", "display" : "Performing Arts Research Collections - Music" }, "27" : { "label" : "COPIES", "value" : "1" }, "28" : { "label" : "Cat. Date", "value" : "2015-05-22" }, "29" : { "label" : "Bib Level", "value" : "m", "display" : "MONOGRAPH" }, "30" : { "label" : "Material Type", "value" : "c", "display" : "SCORE" }, "31" : { "label" : "Bib Code 3", "value" : "-" }, "80" : { "label" : "Record Type", "value" : "b" }, "81" : { "label" : "Record Number", "value" : "20627190" }, "83" : { "label" : "Created Date", "value" : "2015-05-22T13:50:37Z" }, "84" : { "label" : "Updated Date", "value" : "2015-05-23T07:22:03Z" }, "85" : { "label" : "No. of Revisions", "value" : "2" }, "86" : { "label" : "Agency", "value" : "1" }, "89" : { "label" : "Country", "value" : "enk", "display" : "England" }, "98" : { "label" : "PDATE", "value" : "2015-05-22T13:50:37Z" }, "107" : { "label" : "MARC Type", "value" : " " } }, "varFields" : [ { "fieldTag" : "a", "marcTag" : "100", "ind1" : "1", "ind2" : " ", "subfields" : [ { "tag" : "a", "content" : "Faulkes, William," }, { "tag" : "d", "content" : "1863-1933." } ] }, { "fieldTag" : "d", "marcTag" : "650", "ind1" : " ", "ind2" : "0", "subfields" : [ { "tag" : "a", "content" : "Organ music." } ] }, { "fieldTag" : "d", "marcTag" : "650", "ind1" : " ", "ind2" : "7", "subfields" : [ { "tag" : "a", "content" : "Organ music." }, { "tag" : "2", "content" : "fast" }, { "tag" : "0", "content" : "(OCoLC)fst01047598" } ] }, { "fieldTag" : "l", "marcTag" : "028", "ind1" : "2", "ind2" : "2", "subfields" : [ { "tag" : "a", "content" : "1832 S & Co" }, { "tag" : "b", "content" : "Schott & Co." } ] }, { "fieldTag" : "l", "marcTag" : "035", "ind1" : " ", "ind2" : " ", "subfields" : [ { "tag" : "a", "content" : "(OCoLC)247135758" } ] }, { "fieldTag" : "n", "marcTag" : "546", "ind1" : " ", "ind2" : " ", "subfields" : [ { "tag" : "b", "content" : "Staff notation." } ] }, { "fieldTag" : "o", "marcTag" : "001", "ind1" : " ", "ind2" : " ", "content" : "247135758" }, { "fieldTag" : "p", "marcTag" : "260", "ind1" : " ", "ind2" : " ", "subfields" : [ { "tag" : "a", "content" : "London :" }, { "tag" : "b", "content" : "Schott & Co.," }, { "tag" : "c", "content" : "[1899]" } ] }, { "fieldTag" : "q", "marcTag" : "852", "ind1" : "8", "ind2" : " ", "subfields" : [ { "tag" : "h", "content" : "Music (Sheet) 14-119" } ] }, { "fieldTag" : "r", "marcTag" : "300", "ind1" : " ", "ind2" : " ", "subfields" : [ { "tag" : "a", "content" : "13 p. of music ;" }, { "tag" : "c", "content" : "27 x 35 cm." } ] }, { "fieldTag" : "r", "marcTag" : "336", "ind1" : " ", "ind2" : " ", "subfields" : [ { "tag" : "a", "content" : "notated music" }, { "tag" : "2", "content" : "rdacontent" } ] }, { "fieldTag" : "r", "marcTag" : "337", "ind1" : " ", "ind2" : " ", "subfields" : [ { "tag" : "a", "content" : "unmediated" }, { "tag" : "2", "content" : "rdamedia" } ] }, { "fieldTag" : "r", "marcTag" : "338", "ind1" : " ", "ind2" : " ", "subfields" : [ { "tag" : "a", "content" : "volume" }, { "tag" : "2", "content" : "rdacarrier" } ] }, { "fieldTag" : "r", "marcTag" : "382", "ind1" : "0", "ind2" : "1", "subfields" : [ { "tag" : "a", "content" : "organ" } ] }, { "fieldTag" : "s", "marcTag" : "490", "ind1" : "0", "ind2" : " ", "subfields" : [ { "tag" : "a", "content" : "Pieces for the organ composed by William Faulkes ;" }, { "tag" : "v", "content" : "no. 9" } ] }, { "fieldTag" : "t", "marcTag" : "240", "ind1" : "1", "ind2" : "0", "subfields" : [ { "tag" : "a", "content" : "Pieces," }, { "tag" : "m", "content" : "organ," }, { "tag" : "n", "content" : "2nd set." }, { "tag" : "p", "content" : "Legend and finale" } ] }, { "fieldTag" : "t", "marcTag" : "245", "ind1" : "1", "ind2" : "0", "subfields" : [ { "tag" : "a", "content" : "Legend and finale in E flat /" }, { "tag" : "c", "content" : "composed by William Faulkes." } ] }, { "fieldTag" : "u", "marcTag" : "246", "ind1" : "1", "ind2" : "6", "subfields" : [ { "tag" : "a", "content" : "Légende and finale" } ] }, { "fieldTag" : "y", "marcTag" : "003", "ind1" : " ", "ind2" : " ", "content" : "OCoLC" }, { "fieldTag" : "y", "marcTag" : "005", "ind1" : " ", "ind2" : " ", "content" : "20150521181817.0" }, { "fieldTag" : "y", "marcTag" : "008", "ind1" : " ", "ind2" : " ", "content" : "080909s1899    enkzzz         n    zxx dccmIa " }, { "fieldTag" : "y", "marcTag" : "040", "ind1" : " ", "ind2" : " ", "subfields" : [ { "tag" : "a", "content" : "CR2" }, { "tag" : "c", "content" : "CR2" }, { "tag" : "d", "content" : "RES" }, { "tag" : "d", "content" : "OCLCF" }, { "tag" : "d", "content" : "NYP" } ] }, { "fieldTag" : "y", "marcTag" : "048", "ind1" : " ", "ind2" : " ", "subfields" : [ { "tag" : "a", "content" : "kb01" } ] }, { "fieldTag" : "y", "marcTag" : "049", "ind1" : " ", "ind2" : " ", "subfields" : [ { "tag" : "a", "content" : "NYPP" } ] }, { "fieldTag" : "y", "marcTag" : "090", "ind1" : " ", "ind2" : " ", "subfields" : [ { "tag" : "a", "content" : "M11.F263" }, { "tag" : "b", "content" : "L5" } ] }, { "fieldTag" : "y", "marcTag" : "901", "ind1" : " ", "ind2" : " ", "subfields" : [ { "tag" : "a", "content" : "DLB" }, { "tag" : "b", "content" : "SFP" } ] }, { "fieldTag" : "y", "marcTag" : "901", "ind1" : " ", "ind2" : " ", "subfields" : [ { "tag" : "a", "content" : "MARS" } ] }, { "fieldTag" : "y", "marcTag" : "946", "ind1" : " ", "ind2" : " ", "subfields" : [ { "tag" : "a", "content" : "m" } ] }, { "fieldTag" : "y", "marcTag" : "949", "ind1" : " ", "ind2" : "1", "subfields" : [ { "tag" : "z", "content" : "8528" }, { "tag" : "a", "content" : "Music (Sheet) 14-119" }, { "tag" : "h", "content" : "032" }, { "tag" : "l", "content" : "mym38" }, { "tag" : "o", "content" : "1" }, { "tag" : "s", "content" : "-" }, { "tag" : "t", "content" : "007" }, { "tag" : "v", "content" : "DLB/SFP" }, { "tag" : "i", "content" : "33433099164711" } ] }, { "fieldTag" : "_", "content" : "00000ccm  2200385Ia 4500" } ] }
		db.testOverride = true
		db.insertBibRecord(test,function(err,results){
			results.ops[0].id.should.equal(9999)
			done()
		})
	})

	it('updateBibRecord - update a bib record (NEED DB CONNECTION)', function (done) {
		var test = 	{ "_id" : 9999, "id" : 9999, "title" : "NEW TEST" }
		db.testOverride = true
		db.updateBibRecord(test,function(err,results){
			
			results.result.ok.should.equal(1)
			results.result.nModified.should.equal(1)
			results.result.n.should.equal(1)

			done()
		})
	})


	it('insertItemRecord - inset a item record (NEED DB CONNECTION)', function (done) {

		var test = { "_id" : 8888, "id" : 8888, "updatedDate" : "2015-06-12T21:54:42Z", "createdDate" : "2015-06-12T21:54:42Z", "deleted" : false, "bibIds" : [ 9999 ], "location" : { "code" : "myt38", "name" : "Performing Arts Research Collections – Theatre" }, "status" : { "code" : "-", "display" : "AVAILABLE" }, "barcode" : 7777, "callNumber" : "|h*T-CLP (Elf (Musical : Sklar))", "fixedFields" : { "57" : { "label" : "BIB HOLD", "value" : false }, "58" : { "label" : "Copy No.", "value" : 1 }, "59" : { "label" : "Item Code 1", "value" : "0" }, "60" : { "label" : "Item Code 2", "value" : "-" }, "61" : { "label" : "Item Type", "value" : "21" }, "62" : { "label" : "Price", "value" : 0 }, "64" : { "label" : "Checkout Location", "value" : 0 }, "70" : { "label" : "Checkin Location", "value" : 0 }, "74" : { "label" : "Item Use 3", "value" : 0 }, "76" : { "label" : "Total Checkouts", "value" : 0 }, "77" : { "label" : "Total Renewals", "value" : 0 }, "79" : { "label" : "Location", "value" : "myt38", "display" : "Performing Arts Research Collections – Theatre" }, "80" : { "label" : "Record Type", "value" : "i" }, "81" : { "label" : "Record Number", "value" : "32994572" }, "83" : { "label" : "Created Date", "value" : "2015-06-12T21:54:42Z" }, "84" : { "label" : "Updated Date", "value" : "2015-06-12T21:54:42Z" }, "85" : { "label" : "No. of Revisions", "value" : "1" }, "86" : { "label" : "Agency", "value" : "1" }, "88" : { "label" : "Status", "value" : "-", "display" : "AVAILABLE" }, "93" : { "label" : "Internal Use", "value" : 0 }, "94" : { "label" : "Copy Use", "value" : 0 }, "97" : { "label" : "Item Message", "value" : "-" }, "98" : { "label" : "PDATE", "value" : "2015-06-12T21:54:42Z" }, "108" : { "label" : "OPAC Message", "value" : "u" }, "109" : { "label" : "Year-to-Date Circ", "value" : 0 }, "110" : { "label" : "Last Year Circ", "value" : 0 }, "127" : { "label" : "Item Agency", "value" : "32", "display" : "LPA" }, "161" : { "label" : "VI Central", "value" : 0 }, "162" : { "label" : "IR Dist Learn Same Site", "value" : "0" }, "264" : { "label" : "Holdings Item Tag", "value" : "6" }, "265" : { "label" : "Inherit Location", "value" : false } }, "varFields" : [ { "fieldTag" : "c", "marcTag" : "852", "ind1" : "8", "ind2" : " ", "subfields" : [ { "tag" : "h", "content" : "*T-CLP (Elf (Musical : Sklar))" } ] }, { "fieldTag" : "t", "content" : "SFP/cjf" } ] }

		db.testOverride = true
		db.insertItemRecord(test,function(err,results){
			results.ops[0].id.should.equal(8888)
			done()
		})
	})

	it('updateItemRecord - update an item record (NEED DB CONNECTION)', function (done) {
		var test = 	{ "_id" : 8888, "id" : 8888, "title" : "NEW TEST" }
		db.testOverride = true
		db.updateItemRecord(test,function(err,results){
			
			results.result.ok.should.equal(1)
			results.result.nModified.should.equal(1)
			results.result.n.should.equal(1)

			done()
		})
	})


	it('returnBibById - return a bib record by bnumber (NEED DB CONNECTION)', function (done) {

		db.testOverride = true
		db.returnBibById(9999,function(err,results){			
			results.length.should.be.above(0)
			done()
		})
	})

	it('returnItemByBibIds - return a item record by bnumber number (NEED DB CONNECTION)', function (done) {

		db.testOverride = true
		db.returnItemByBibIds(9999,function(err,results){

			results.length.should.be.above(0)
			done()
		})
	})

	it('allBibs - return a cursor looping through all the bib records (NEED DB CONNECTION)', function (done) {

		db.testOverride = true

		db.allBibs(function(doc,cursor,db){

			should.exist(doc['_id'])

			cursor.should.be.type("object")
			//you would then call
			//cursor.resume()
			
			done()
		})
	})

	it('allItems - return a cursor looping through all the items records (NEED DB CONNECTION)', function (done) {

		db.testOverride = true

		db.allItems(function(doc,cursor,db){

			should.exist(doc['_id'])

			cursor.should.be.type("object")

			//you would then call
			//cursor.resume()

			done()
		})
	})



})