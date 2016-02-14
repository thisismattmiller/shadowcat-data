#!/usr/local/bin/node
var db = require("../lib/db.js")
var util = require("../lib/util.js")
var request = require('request')
var $ = require('cheerio')
var async = require('async')
var s3 = require('s3')
var fs = require( 'fs' )


var counter = 0
var totalChanged = 0

//get all the filenames we have
var client = s3.createClient({
	maxAsyncS3: 20,     // this is the default
	s3RetryCount: 3,    // this is the default
	s3RetryDelay: 1000, // this is the default
	multipartUploadThreshold: 20971520, // this is the default (20 MB)
	multipartUploadSize: 15728640, // this is the default (15 MB)
	s3Options: {
		accessKeyId: process.env.AWSKEY,
		secretAccessKey: process.env.AWSSECRET,
		region: "us-east-1"
	}
})


var extractHtml = function(node){

	var note = ""
	node.children.forEach(c => {

		if (c.type==='text'){
			note = note + c.data
		}
		if (c.name==='br'){
			note = note + "\n\n"
		}
		if (c.name==='i'){
			c.children.forEach(cc => {
				if (cc.type==='text'){
					note = note + "*" + cc.data + "*"
				}
				if (cc.name ==='b'){ cc.children.forEach(ccc=>{ if (ccc.type==='text'){ note = note + "_" + ccc.data + "_"  }   })   }
				if (cc.name ==='em'){ cc.children.forEach(ccc=>{ if (ccc.type==='text'){ note = note + "*" + ccc.data + "*"  }   })   }
				if (cc.name ==='strong'){ cc.children.forEach(ccc=>{ if (ccc.type==='text'){ note = note + "_" + ccc.data + "_"  }   })   }

			})
		}

		if (c.name==='b'){
			c.children.forEach(cc => {
				if (cc.type==='text'){
					note = note + "_" + cc.data + "_"
				}
				if (cc.name ==='i'){ cc.children.forEach(ccc=>{ if (ccc.type==='text'){ note = note + "*" + ccc.data + "*"  }   })   }
				if (cc.name ==='em'){ cc.children.forEach(ccc=>{ if (ccc.type==='text'){ note = note + "*" + ccc.data + "*"  }   })   }
				if (cc.name ==='strong'){ cc.children.forEach(ccc=>{ if (ccc.type==='text'){ note = note + "_" + ccc.data + "_"  }   })   }

			})
		}
		if (c.name==='p'){
			c.children.forEach(cc => {
				if (cc.type==='text'){
					note = note + cc.data		
				}
				if (cc.name ==='i'){ cc.children.forEach(ccc=>{ if (ccc.type==='text'){ note = note + "*" + ccc.data + "*"  }   })   }
				if (cc.name ==='b'){ cc.children.forEach(ccc=>{ if (ccc.type==='text'){ note = note + "_" + ccc.data + "_"  }   })   }
				if (cc.name ==='em'){ cc.children.forEach(ccc=>{ if (ccc.type==='text'){ note = note + "*" + ccc.data + "*"  }   })   }
				if (cc.name ==='strong'){ cc.children.forEach(ccc=>{ if (ccc.type==='text'){ note = note + "_" + ccc.data + "_"  }   })   }

			})
			note = note + "\n\n"
		}
		if (c.name==='span'){


			if (c.attribs) if (c.attribs.id) if (c.attribs.id == 'Label_Content') return false
			if (c.attribs) if (c.attribs.class) if (c.attribs.class.search(/PageHeader/i) > -1)  return false 


			c.children.forEach(cc => {
				if (cc.type==='text'){
					note = note + cc.data		
				}
				if (cc.name ==='br'){ note = note + "\n\n" }
				if (cc.name ==='i'){ cc.children.forEach(ccc=>{ if (ccc.type==='text'){ note = note + "*" + ccc.data + "*"  }   })   }
				if (cc.name ==='b'){ cc.children.forEach(ccc=>{ if (ccc.type==='text'){ note = note + "_" + ccc.data + "_"  }   })   }
				if (cc.name ==='em'){ cc.children.forEach(ccc=>{ if (ccc.type==='text'){ note = note + "*" + ccc.data + "*"  }   })   }
				if (cc.name ==='strong'){ cc.children.forEach(ccc=>{ if (ccc.type==='text'){ note = note + "_" + ccc.data + "_"  }   })   }

				if (cc.name ==='span'){
					cc.children.forEach(ccc=>{

						if (ccc.type==='text' && JSON.stringify(ccc.parent.attribs).search(/italic/i) === -1 && JSON.stringify(ccc.parent.attribs).search(/bold/i) === -1  ){
							note = note + ccc.data		
						}
						if (ccc.type==='text' && JSON.stringify(ccc.parent.attribs).search(/italic/i) > -1 && JSON.stringify(ccc.parent.attribs).search(/bold/i) === -1  ){
							note = note + "*" + ccc.data + "*"
						}
						if (ccc.type==='text' && JSON.stringify(ccc.parent.attribs).search(/italic/i) === -1 && JSON.stringify(ccc.parent.attribs).search(/bold/i) > -1  ){
							note = note + "_" + ccc.data + "_"
						}
					})
				}



			})

		}


		if (c.name==='strong'){
			c.children.forEach(cc => {
				if (cc.type==='text'){
					note = note + "_" + cc.data + "_"
				}
			})
		}


	})


	return note


}



db.allBibs(function(bib,cursor,mongoConnection){

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + " | " + totalChanged)


	if (!bib){
		console.log("Complete:", counter + " | " + totalChanged)
		return true;
	}

	counter++

	// if (counter<10000){
	// 	cursor.resume()
	// 	return true
	// }


	if (bib['sc:isbn'] && !bib['bt:check']){


		if (bib['sc:isbn'].length>0){

			var foundSomething = false


			//go through each isbn and try the next isbn (there might be multiple isbns for a single bib)
			async.eachSeries(bib['sc:isbn'], function(isbn, isbnCallback) {

				

				if (foundSomething){ isbnCallback(); return false}

				// console.log("Trying:",isbn)

				//isbn = '9781771661317'
				//isbn = 9780062483911
				//isbn = 9781498512626
				//isbn = 9780826458896
				//isbn = 9781510702080

				//console.log('http://contentcafe2.btol.com/ContentCafeClient/ContentCafe.aspx?UserID=NYPL49807&Password=CC68707&ItemKey='+ isbn +'&Options=N')
				request('http://contentcafe2.btol.com/ContentCafeClient/ContentCafe.aspx?UserID=NYPL49807&Password=CC68707&ItemKey='+ isbn +'&Options=N', function (error, response, body) {
					if (!error && response.statusCode == 200) {		

						if (body.search('No content currently exists for this item')===-1 && body.search('Invalid key')===-1){

							foundSomething = true

							var summary = (body.search('Navigate to annotations information')>-1) ? true : false
							var authorNotes = (body.search('Navigate to author notes information')>-1) ? true : false
							var flap = (body.search('Navigate to inside flap information')>-1) ? true : false
							var cover = (body.search('Navigate to jacket information')>-1) ? true : false
							var review = (body.search('Navigate to review information')>-1) ? true : false

							// console.log("summary",summary)
							// console.log("authorNotes",authorNotes)
							// console.log("flap",flap)
							// console.log("cover",cover)
							// console.log("review",review)


							async.parallel({
								summary: function(callback){

									var summaries = []

									if (summary){
										request('http://contentcafe2.btol.com/ContentCafeClient/Summary.aspx?UserID=NYPL49807&Password=CC68707&ItemKey='+ isbn +'&Options=N', function (error, response, body) {
											if (!error && response.statusCode == 200) {		
												var parsedHTML = $.load(body)

												parsedHTML('td div').map(function(i, node) {

													var note = extractHtml(node)

													if (note.trim()!="" && note.search(/Publisher Summary/) === -1 && summaries.indexOf(note)===-1){
														summaries.push(note)
													}											

												})

												parsedHTML('td[align="left"]').map(function(i, node) {											
													var note = extractHtml(node)
													if (note.trim()!="" && note.search(/Publisher Summary/) === -1 && summaries.indexOf(note)===-1){
														summaries.push(note)
													}
												})

												//console.log(parsedHTML('td div').text())
												//console.log(parsedHTML('td[align="left"]').text())



											}else{
												console.log("ERROR!",error, response.statusCode)
											}
											callback(null,summaries)


										})
									}else{
										callback(null,[])
									}
							
									
								},
								authorNotes: function(callback){
									var authorNotesResults = []

									if (authorNotes){
										request('http://contentcafe2.btol.com/ContentCafeClient/AuthorNotes.aspx?UserID=NYPL49807&Password=CC68707&ItemKey='+ isbn +'&Options=N', function (error, response, body) {
											if (!error && response.statusCode == 200) {		
												var parsedHTML = $.load(body)

												parsedHTML('td div').map(function(i, node) {
													var note = extractHtml(node)
													if (note.trim()!="" && note.search(/Publisher Summary/) === -1 && authorNotesResults.indexOf(note)===-1){
														authorNotesResults.push(note)
													}		

												})

												parsedHTML('td[align="left"]').map(function(i, node) {											
													var note = extractHtml(node)
													if (note.trim()!="" && note.search(/Publisher Summary/) === -1 && authorNotesResults.indexOf(note)===-1){
														authorNotesResults.push(note)
													}
												})

												//console.log(parsedHTML('td div').text())
												//console.log(parsedHTML('td[align="left"]').text())



											}else{
												console.log("ERROR!",error, response.statusCode)
											}
											callback(null,authorNotesResults)


										})
									}else{
										callback(null,[])
									}
							


								},
								flap: function(callback){
									
									var flapResults = []

									if (flap){

										request('http://contentcafe2.btol.com/ContentCafeClient/Flap.aspx?UserID=NYPL49807&Password=CC68707&ItemKey='+ isbn +'&Options=N', function (error, response, body) {
											if (!error && response.statusCode == 200) {		
												var parsedHTML = $.load(body)

												parsedHTML('td div').map(function(i, node) {
													var note = extractHtml(node)
													if (note.trim()!="" && note.search(/Publisher Summary/) === -1 && flapResults.indexOf(note)===-1){
														flapResults.push(note)
													}
												})

												parsedHTML('td[align="left"]').map(function(i, node) {											
													var note = extractHtml(node)
													if (note.trim()!="" && note.search(/Publisher Summary/) === -1 && flapResults.indexOf(note)===-1){
														flapResults.push(note)
													}
												})

												//console.log(parsedHTML('td div').text())
												//console.log(parsedHTML('td[align="left"]').text())



											}else{
												console.log("ERROR!",error, response.statusCode)
											}
											callback(null,flapResults)


										})
									}else{
										callback(null,[])
									}


								},
								cover: function(callback){
								

									if (cover){


										var url = "http://imagesb.btol.com/ContentCafe/Jacket.aspx?UserID=ContentCafeClient&Password=Client&Return=T&Type=L&Value=" + isbn

										var req = request.get( url )
											.on( 'response', function( res ){

												if (res.statusCode==parseInt(200)){

													// create file write stream
													var fws = fs.createWriteStream( 'data/bookcover.jpg' )
													// setup piping
													res.pipe( fws )

													res.on( 'end', function(){					  

													  process.nextTick(function(){

													  	var stats = fs.statSync('data/bookcover.jpg' )
 														var fileSizeInBytes = stats["size"]

 														if (fileSizeInBytes>=2800){

															//upload it to s3
															var params = {
																localFile: 'data/bookcover.jpg',
																s3Params: {
																	Bucket: "data.nypl.org",
																	Key: "bookcovers/"+bib._id + ".jpg"
																}
															}
															var uploader = client.uploadFile(params)
															uploader.on('error', function(err) {
																//console.error("unable to upload:", err.stack);
																console.log("unable to upload:")
																console.log(err.stack)
																console.log(filename)
																fs.unlinkSync('data/bookcover.jpg')
																callback(null,false)
															})
															uploader.on('end', function() {
																fs.unlinkSync('data/bookcover.jpg')
																callback(null,true)						
															})


 														}else{
 															callback(null,false)
 														}

													  })						  
													})
												}else{
													callback(null,false)
												}
											})


									}else{
										callback(null,false)
									}

									
								},
								review: function(callback){						
									

									var reviewResults = []

									if (review){
										request('http://contentcafe2.btol.com/ContentCafeClient/ReviewsDetail.aspx?UserID=NYPL49807&Password=CC68707&ItemKey='+ isbn +'&Options=N', function (error, response, body) {
											if (!error && response.statusCode == 200) {		

												var parsedHTML = $.load(body)


												parsedHTML('td div').map(function(i, node) {
													var note = extractHtml(node)
													if (note.trim()!=""){
														reviewResults.push(note)
													}
												})

												parsedHTML('td[align="left"]').map(function(i, node) {											
													var note = extractHtml(node)
													if (note.trim()!="" ){
														reviewResults.push(note)
													}
												})

												//console.log(parsedHTML('td div').text())
												//console.log(parsedHTML('td[align="left"]').text())



											}else{
												console.log("ERROR!",error, response.statusCode)
											}


											for (var x in reviewResults){
												if (reviewResults[x].search(/\sReviews$/)>-1){
													if (reviewResults[parseInt(x)+1]){
														reviewResults[parseInt(x)+1] = reviewResults[x] + "\n\n" + reviewResults[parseInt(x)+1]
														reviewResults[parseInt(x)] = ""
													}
												}
											}

											var final = []
											reviewResults.forEach(r => { if (r!="") final.push(r)} )
											callback(null,final)


										})
									}else{
										callback(null,[])
									}



								},							
							},
							function(err, results) {
							// results is now equals to: {one: 1, two: 2}
								//console.log(results)

								var updateObj = {
									id: bib._id,
									"bt:check" : Math.floor(Date.now() / 1000),
									"bt:summary" : results.summary,
									"bt:authorNotes" : results.authorNotes,
									"bt:flap" : results.flap,
									"bt:review" : results.review,
									"bt:cover" : results.cover,
								}

								if (updateObj['bt:summary'].length>0 || updateObj['bt:authorNotes'].length>0 || updateObj['bt:flap'].length>0 || updateObj['bt:review'].length>0 || updateObj['bt:cover']){
									totalChanged++
									console.log("\n",bib._id)
								}

								db.updateBibRecord(updateObj,function(err,r){

									if (err) console.log("ERRROR:",err)

		
									setTimeout(function(){						
										isbnCallback()
									},500)

								}, mongoConnection)

					


							})

						}else{
							setTimeout(function(){						
								isbnCallback()
							},500)								
						}

					}else{
						console.log("ERROR!",error, response.statusCode)
						setTimeout(function(){						
							isbnCallback()
						},500)

					}




				})


			}, function(err){
			   
			   cursor.resume()

			})

			return true
		}		
	}

	cursor.resume()


	return true



})

