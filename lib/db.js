//this module works with the datastore to do things~

var MongoClient = require('mongodb').MongoClient,
	config = require("config")


var exports = module.exports = {}

var mongoConnectURL = config['DB']['mongoConnectURL']

var mongoConnectURLRegistryIngest = config['IngestDB']['mongoConnectURL']

exports.testOverride = false


exports.createBaseMetadata = function(datetime,cb){

	//delete the existing metadata
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('meta')
		collection.remove({ name : "metadata" }, function(err, result) {
			var baseData = {

				name : "metadata",
				bibLastUpdatedDate : datetime,
				bibLastUpdatedOffset: 0,
				itemLastUpdatedDate : datetime,
				itemLastUpdatedOffset : 0

			}

			collection.insert(baseData, function(err, result) {

				db.close()

				if (cb) cb(result)

			})
		});

	});	


}


exports.getMetadata = function(cb){

	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('meta')
		collection.find({name : "metadata"}).toArray(function(err, docs) {
			db.close()
			cb(err,docs)
		});
	});	
}





exports.updateBibMetadata = function(date,offset,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('meta')
		collection.update({ name : "metadata" }
			, { $set: { bibLastUpdatedDate : date, bibLastUpdatedOffset : offset } }, function(err, result) {
			if (cb) cb(err,result);
		})

	})

}
exports.updateItemMetadata = function(date,offset,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('meta')
		collection.update({ name : "metadata" }
			, { $set: { itemLastUpdatedDate : date, itemLastUpdatedOffset : offset } }, function(err, result) {
			if (cb) cb(err,result);
		})
	})
}



exports.updateBibRecord = function(bib,cb,db){

	if (db){

		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')
		collection.update({ _id : bib.id }
			, { $set: bib }, function(err, result) {
			if (cb) cb(err,result);
		})


	}else{

		MongoClient.connect(mongoConnectURL, function(err, db) {
			var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')
			collection.update({ _id : bib.id }
				, { $set: bib }, function(err, result) {
				db.close()
				if (cb) cb(err,result);
			})

		})


	}


}


exports.insertBibRecord = function(bib,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')
		collection.insert(bib, function(err, result) {
			if (cb) cb(err,result);
			db.close()
		})
	})
}


exports.returnBibByCoarseLCC = function(lcc,cb){



	MongoClient.connect(mongoConnectURL, function(err, db) {

		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')

		collection.find({ 'sc:lccCoarse' :  lcc }).toArray(function(err, docs) {
			db.close()
			cb(err,docs,db)
		})

	})

	
}









exports.updateItemRecord = function(item,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('item')
		collection.update({ _id : item.id }
			, { $set: item }, function(err, result) {
			db.close()
			if (cb) cb(err,result);
		})

	})

}


exports.insertItemRecord = function(item,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('item')
		collection.insert(item, function(err, result) {
			if (cb) cb(err,result);
			db.close()
		})
	})
}


exports.returnBibById = function(id,cb,db){


	//if a db is already active 
	if (db){

		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')
		collection.find({_id : id}).toArray(function(err, docs) {
			cb(err,docs)
		});

	}else{

		MongoClient.connect(mongoConnectURL, function(err, db) {
			var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')
			collection.find({_id : id}).toArray(function(err, docs) {
				db.close()
				cb(err,docs)
			});
		});	

	}

}

exports.returnItemByBibIds = function(id,cb,db){


	//if a db is already active 
	if (db){

		var collection = (exports.testOverride) ? db.collection('test') : db.collection('item')
		collection.find({bibIds : id}).toArray(function(err, docs) {
			cb(err,docs)
		});

	}else{

		MongoClient.connect(mongoConnectURL, function(err, db) {
			var collection = (exports.testOverride) ? db.collection('test') : db.collection('item')
			collection.find({bibIds : id}).toArray(function(err, docs) {
				db.close()
				cb(err,docs)
			})
		})

	}




}




exports.allBibs = function(cb){



	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')


		var cursor = collection.find()
		
		cursor.on('data', function(doc) {

			cursor.pause()

			//send the data to the calling function with the cursor

			cb(doc,cursor,db)


		});



		cursor.once('end', function() {
			cb(null,null,db)
			db.close();
		});




	})


}

exports.allBibsOneField = function(field,cb){


	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')


		var cursor = collection.find({}, JSON.parse(" { \"" + field + "\" : 1  } "))
		
		cursor.on('data', function(doc) {

			cursor.pause()

			//send the data to the calling function with the cursor

			cb(doc,cursor,db)


		});



		cursor.once('end', function() {
			cb(null,null,db)
			db.close();
		});




	})


}

exports.allBibsReverse = function(cb){



	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')


		var cursor = collection.find({}).sort({ $natural : -1})
		
		cursor.on('data', function(doc) {

			cursor.pause()

			//send the data to the calling function with the cursor

			cb(doc,cursor,db)


		});



		cursor.once('end', function() {
			cb(null,null,db)
			db.close();
		});




	})


}


exports.allBibsByClassmark = function(classmark, cb){



	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')


		var cursor = collection.find({ 'sc:classmark' : classmark }, { 'sc:lccCoarse' : 1, 'classify:lcc' : 1, "classify:dcc" : 1})
		
		cursor.on('data', function(doc) {

			cursor.pause()

			//send the data to the calling function with the cursor

			cb(doc,cursor,db)


		});



		cursor.once('end', function() {
			cb(null,cursor,db)
			db.close();
		});




	})


}



exports.allBibsByLccCoarse = function(range, cb){



	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')


		var cursor = collection.find({ 'sc:lccCoarse' : range }, { 'sc:classmark' : 1, 'classify:lcc' : 1, "classify:dcc" : 1})
		
		cursor.on('data', function(doc) {

			cursor.pause()

			//send the data to the calling function with the cursor

			cb(doc,cursor,db)


		});



		cursor.once('end', function() {
			cb(null,cursor,db)
			db.close();
		});




	})


}

exports.countLccCoarse = function(range, cb){



	MongoClient.connect(mongoConnectURL, function(err, db) {

		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')



		collection.find({ 'sc:lccCoarse' :  range })
			.count(function(err, docs) {

				
				db.close()
				cb(err,docs,db)
		})

	})



}






exports.allItems = function(cb){



	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('item')


		var cursor = collection.find({}).sort({ $natural: -1 });
		
		cursor.on('data', function(doc) {

			cursor.pause()

			//send the data to the calling function with the cursor

			cb(doc,cursor,db)


		});



		cursor.once('end', function() {
			cb(null,null,db)
			db.close();
		});




	})


}

exports.returnRegistryDb = function(cb){
	MongoClient.connect(mongoConnectURLRegistryIngest, function(err, db) {
		if (err) console.log(err)
		cb(err,db)
	})
}

exports.returnShadowcatDb = function(cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		if (err) console.log(err)
		cb(err,db)
	})
}

exports.returnViafLookup = function(cb){
	MongoClient.connect(mongoConnectURLRegistryIngest, function(err, db) {
		var collection = db.collection('viafLookup')
		cb(err,collection)
	})
}



exports.dropTestCollection = function(cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = db.collection('test')
		collection.drop(function(err, reply) {
			if (cb) cb(reply)
		})
	})
}



exports.insertAPIHoldingsRecord = function(item,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('apiHoldings')
		collection.insert(item, function(err, result) {
			if (cb) cb(err,result);
			db.close()
		})
	})
}

exports.insertAPILccnRecord = function(item,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('apiLccn')
		collection.insert(item, function(err, result) {
			if (cb) cb(err,result);
			db.close()
		})
	})
}

exports.insertAPIClassifyRecord = function(item,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('apiClassify')
		collection.insert(item, function(err, result) {
			if (cb) cb(err,result);
			db.close()
		})
	})
}

exports.insertAPIWorldcatRecord = function(item,cb,db){

	if (db){

			var collection = (exports.testOverride) ? db.collection('test') : db.collection('apiWorldcat')
			collection.insert(item, function(err, result) {
				if (err) console.log(err)
				if (cb) cb(err,result);
			})

	}else{
		MongoClient.connect(mongoConnectURL, function(err, db) {
			var collection = (exports.testOverride) ? db.collection('test') : db.collection('apiWorldcat')
			collection.insert(item, function(err, result) {
				if (err) console.log(err)
				if (cb) cb(err,result);
				db.close()
			})
		})

	}

}

