#!/usr/local/bin/node

var db = require('../lib/db.js')
var util = require('../lib/util.js')
var fs = require('fs')
var output = fs.createWriteStream('data/mixed_bibs.txt')

var counter = 0

util.parseLocationFile((locations) => {
  console.log(locations)

  db.allBibsReverse(function (bib, cursor, mongoConnection) {
    if (!bib) {
      console.log("That's it!")
      output.end()
      return true
    }

    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    process.stdout.write(counter + '')

    counter++

    // pause the so we can work on the current record
    cursor.pause()

    // console.log('Bib record:')
    // console.log(bib)

    // ask
    db.returnItemByBibIds(bib.id, function (err, items) {
      if (err) console.log(err)
      // console.log('Item records:')
      // console.log(items)
      var hasResearch = false
      var hasCirc = false

      items.forEach((item) => {
        if (item.location && item.location.code) {
          item.location.code = item.location.code.trim().toLowerCase()
          if (locations[item.location.code]) {
            if (locations[item.location.code].research === 'true') {
              hasResearch = true
            }
            if (locations[item.location.code].research === 'false') {
              hasCirc = true
            }
          }
        }
      })

      if (hasResearch && hasCirc) {
        console.log(bib._id)
        output.write(bib._id + '\n')
      }

      // var updateRecord  = {
      // 	id : bib.id,
      // 	"whatever field" : "new value"
      // }

      // db.updateBibRecord(updateRecord,function(err,r){

      // 	if (err) console.log("ERRROR:",err)

      // 	console.log(updateRecord)
      // 	console.log(r.result)
      // 	cursor.resume()

      // }, mongoConnection)

      // we are resuming the record here
      cursor.resume()
    // but if are updating it we need to resume in the callback of the update function, cursor.resume() should only be called once
    }, mongoConnection)
  })
})
