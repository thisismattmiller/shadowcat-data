#!/usr/local/bin/node

var db = require('../lib/db.js')
var util = require('../lib/util.js')
var async = require('async')
var fs = require('fs')
var human = require('humanparser')

require('string_score')

var counter = 0

var namePartSubcode = ['a', 'b', 'c', 'd', 'q', 'n']
var checkFields = ['100', '110', '111', '700', '710', '711', '790', '600', '610', '611']

var checkFieldsPersonal = ['100', '700', '600', '790']
var checkFieldsCorporate = ['110', '710', '610']
var checkFieldsMeeting = ['111', '711', '611']

var countFoundInLC = 0
var countFoundInViafViaOclc = 0
var countLocal = 0
var countAddedUnmatchedNames = 0
var countTotalNames = 0
var relatorsCodes = {}

setInterval(function () {
  var r = {
    countTotalNames: countTotalNames,
    countFoundInLC: countFoundInLC,
    countFoundInViafViaOclc: countFoundInViafViaOclc,
    countLocal: countLocal,
    countAddedUnmatchedNames: countAddedUnmatchedNames,
    relatorsCodes: relatorsCodes,
  }

  fs.writeFile(__dirname + '/../log/agent_results.json', JSON.stringify(r, null, 4), function (err) {
    if (err) console.log(err)
  })
}, 30000)

// a small double check at the end of the process to filter out any obvious problems like dupes
var qualityControl = function (agents) {
  var returnAgentsNameCheck = [],returnAgentsViafCheck = [], addedNamesRoleCombo = [], addedViafRoleCombo = []

  agents.forEach(function (n) {
    if (n.nameLocal) {
      var comboName = util.normalizeAndDiacritics(n.nameLocal) + n.contributor.toString()

      if (addedNamesRoleCombo.indexOf(comboName) == -1) {
        addedNamesRoleCombo.push(comboName)
        returnAgentsNameCheck.push(n)
      }
    } else {
      returnAgentsNameCheck.push(n)
    }
  })

  returnAgentsNameCheck.forEach(function (n) {
    if (n.viaf) {
      var comboViaf = n.viaf + n.contributor.toString()
      if (addedViafRoleCombo.indexOf(comboViaf) == -1) {
        addedViafRoleCombo.push(comboViaf)
        returnAgentsViafCheck.push(n)
      }
    } else {
      returnAgentsViafCheck.push(n)
    }
  })

  return returnAgentsViafCheck
}

db.returnViafLookup(function (err, viaf) {
  db.allBibs(function (bib, cursor, mongoConnection) {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    process.stdout.write(counter + ' | ' + 'countTotalNames: ' + countTotalNames + ' countFoundInLC: ' + countFoundInLC + ' countFoundInViafViaOclc: ' + countFoundInViafViaOclc + ' countLocal: ' + countLocal + ' countAddedUnmatchedNames: ' + countAddedUnmatchedNames)

    if (!bib) {
      console.log('\n\nFinshed!\n\n')
      setTimeout(function () {
        process.exit()
      }, 1000)
      return
    }

    counter++

    var names = []

    // build all the agents
    if (bib.varFields) {
      for (var field in bib.varFields) {
        field = bib.varFields[field]
        // 100, 110, 111
        // 700, 710, 711

        if (field.marcTag) {
          if (checkFields.indexOf(field.marcTag) > -1) {
            var name = '', relator = false, type = false

            if (checkFieldsPersonal.indexOf(field.marcTag) > -1) type = 'personal'
            if (checkFieldsCorporate.indexOf(field.marcTag) > -1) type = 'corporate'
            if (checkFieldsMeeting.indexOf(field.marcTag) > -1) type = 'meeting'

            if (field.subfields) {
              for (var subfield in field.subfields) {
                subfield = field.subfields[subfield]

                if (subfield.tag) {
                  if (namePartSubcode.indexOf(subfield.tag) > -1) {
                    if (subfield.content) {
                      name = name + ' ' + subfield.content
                    }
                  }

                  if (subfield.tag == 'e' || subfield.tag == '4') {
                    if (subfield.content) {
                      relator = subfield.content
                    }
                  }
                }
              }
            }

            name = name.trim()

            if (name != '') {
              if (field.marcTag != '600' && field.marcTag != '610' && field.marcTag != '611') {
                names.push({ name: name, relator: relator, contributor: true, type: type })
              } else {
                names.push({ name: name, relator: relator, contributor: false, type: type })
              }
            }
          }
        }
      }
    }

    // doing a edge case here where these legacy arev records are all compressed into a single field
    if (bib['sc:arev']) {
      var namesFix = []

      names.forEach(function (aName) {
        if (aName.name.search(/\-\-/) > -1 || aName.name.search(/I\.\s/) > -1 || aName.name.search(/1\./) > -1) {
          var nameString = aName.name

          var arevNames = util.arevParseNames(nameString)

          if (arevNames) {
            arevNames.forEach(function (n) {
              namesFix.push({
                name: n,
                relator: false,
                contributor: true,
                type: 'personal'
              })
            })
          }

          // we want to check any names in the subject headings
          var arevSubjects = util.arevParseSubjects(nameString)
          arevSubjects = util.arevParseSubjectsDeName(arevSubjects)
          if (arevSubjects.names) {
            arevSubjects.names.forEach(function (n) {
              namesFix.push({
                name: n,
                relator: false,
                contributor: false,
                type: 'personal'
              })
            })
          }
        } else {
          namesFix.push(aName)
        }
      })

      console.log(namesFix)

      names = namesFix
    }

    var newNames = []

    async.each(names, function (name, eachCallback) {
      // find if this one exists

      var normal = util.normalizeAndDiacritics(name.name)

      // something to experiment with obviously bad names
      // if (normal.length<5){
      // 	console.log(normal)
      // 	console.log(name)
      // 	console.log(bib._id)
      // }

      viaf.find({normalized: normal, hasLc: true}).toArray(function (err, viafAry) {
        if (viafAry.length > 0) {
          // console.log(viafAry)

          // console.log(name.name,bib._id)
          // console.log(viafAry[0])
          name.viafName = viafAry[0].viafTerm
          name.viafId = viafAry[0]._id

          newNames.push(name)
          eachCallback()
        }else if (viafAry.length == 0) {
          // check GERMANY!!!
          viaf.find({normalized: normal, hasDbn: true}).toArray(function (err, viafAry) {
            if (viafAry.length > 0) {
              // console.log("FOUND IN GERMANY!")
              // console.log(name.name,bib._id)
              // console.log(viafAry[0])
              name.viafName = viafAry[0].viafTerm
              name.viafId = viafAry[0]._id
            } else {
              // console.log("No match ------ ",normal,bib._id)
              // console.log(name)
              name.viafId = false
            }

            newNames.push(name)
            eachCallback()
          })
        }
      })

      // fires when all the lookups are done

    }, function (err) {
      if (err) console.log(err)

      // lets gather all of our viaf IDS and their labels
      var viafIds = [], viafNameLookup = {}, externalViafMatches = []

      if (bib['classify:creatorVIAF']) {
        bib['classify:creatorVIAF'].forEach(function (v) {
          v = v.toString()
          if (viafIds.indexOf(v) == -1) {
            viafIds.push(v); externalViafMatches.push(v)
            if (!viafNameLookup[v])
              viafNameLookup[v] = { nameLc: '', nameViaf: '', contributor: true } }
        })
      }

      if (bib['wc:contributor']) {
        bib['wc:contributor'].forEach(
          function (v) {
            v.id = v.id.toString()
            if (viafIds.indexOf(v.id) == -1) {
              viafIds.push(v.id)
              externalViafMatches.push(v.id)
              if (!viafNameLookup[v.id])
                viafNameLookup[v.id] = { nameLc: '', nameViaf: v.name, contributor: true }
            }

            // make sure it has the name
            if (v.name != '' && viafNameLookup[v.id].nameViaf == '') viafNameLookup[v.id].nameViaf = v.name
          })
      }

      if (bib['wc:creator']) {
        bib['wc:creator'].forEach(
          function (v) {
            v.id = v.id.toString()
            if (viafIds.indexOf(v.id) == -1) {
              viafIds.push(v.id)

              externalViafMatches.push(v.id)
              if (!viafNameLookup[v.id])
                viafNameLookup[v.id] = { nameLc: '', nameViaf: v.name, contributor: true  }
            }

            // make sure it has the name

            if (v.name != '' && viafNameLookup[v.id].nameViaf == '') viafNameLookup[v.id].nameViaf = v.name
          })
      }

      if (bib['wc:aboutViaf']) {
        bib['wc:aboutViaf'].forEach(
          function (v) {
            v.id = v.id.toString()
            if (viafIds.indexOf(v.id) == -1) {
              viafIds.push(v.id)
              externalViafMatches.push(v.id)
              if (!viafNameLookup[v.id])
                viafNameLookup[v.id] = { nameLc: '', nameViaf: v.name, contributor: false }
            }

            // make sure it has the name

            if (v.name != '' && viafNameLookup[v.id].nameViaf == '') viafNameLookup[v.id].nameViaf = v.name
          })
      }

      // if there were any IDS that we matched vis LC/DNB Exact Match
      newNames.forEach(function (name) {
        if (name.viafId) {
          if (viafIds.indexOf(name.viafId) == -1) {
            viafIds.push(name.viafId)
            viafNameLookup[name.viafId] = { nameLc: '', nameViaf: '', contributor: name.contributor }
          }
        }
      })

      var checkOclc = false
      newNames.forEach(function (name) {if (!name.viafId) checkOclc = true})

      // console.log("checkOclc:",checkOclc)
      // console.log("newNames:",newNames)

      if (checkOclc) {
        // now grab the possible records for all these viafs
        viaf.find({ _id: {$in: viafIds } }).toArray(function (err, viafAry) {
          // loop through and fill out any data

          // console.log("viafAry:",viafAry)

          // we have the real labels from our local VIAF instance
          viafAry.forEach(function (v) {
            if (viafNameLookup[v._id]) {
              viafNameLookup[v._id].nameLc = v.lcTerm
              viafNameLookup[v._id].nameViaf = v.viafTerm
            }
          })

          // create a jank alt name from any viaf natural lanuage one to try to also match on below
          for (var x in viafNameLookup) {
            if (viafNameLookup[x].nameViaf) {
              var parts = human.parseName(viafNameLookup[x].nameViaf)

              if (parts.firstName && parts.lastName) {
                viafNameLookup[x].nameViafAlt = ''
                viafNameLookup[x].nameViafAlt = viafNameLookup[x].nameViafAlt + parts.lastName
                if (parts.suffix) viafNameLookup[x].nameViafAlt = viafNameLookup[x].nameViafAlt + ' ' + parts.suffix

                viafNameLookup[x].nameViafAlt = viafNameLookup[x].nameViafAlt + ', ' + parts.firstName + ' '
                if (parts.middleName) viafNameLookup[x].nameViafAlt = viafNameLookup[x].nameViafAlt + ' ' + parts.middleName
                viafNameLookup[x].nameViafAlt = viafNameLookup[x].nameViafAlt.trim()
              }
            }
          }

          // remove any matches we know of already
          // newNames.forEach(function(n){
          // 	if (n.viafId){
          // 		delete viafLookup[n.viafId]
          // 	}
          // })

          // the idea is to try and match local names to worldcat names at an increasingly higher threashold
          // until there are no duplicate VIAF identfiers among the agents

          var viafDupe = true, viafDupeCheck = 0, threshold = 0.1
          var ogNewNames = JSON.parse(JSON.stringify(newNames))

          // this first loop makes sure we did not reuse the same VIAF id in two agents, if so try it all again with a higher intail threshold
          while (viafDupe === true && viafDupeCheck < 11){
            var hasDupe = true, dupeCheckCount = 0

            // this second loop does the matching withing the agents to try to assign the best Viaf name to local name, it too checks for dupes at the per record scale
            while (hasDupe === true && dupeCheckCount < 11){
              threshold = threshold + 0.1
              dupeCheckCount++
              hasDupe = false

              newNames = JSON.parse(JSON.stringify(ogNewNames))

              // now try to match anything left with the viaf entries
              newNames.forEach(function (n) {
                if (!n.viafId) {
                  var bestMatch = false, bestScore = -100
                  for (var x in viafNameLookup) {
                    // all we really care about is if this possibly local name is represented somehow in the
                    // data from world cat or classify

                    var scoreLc = 0, scoreViaf = 0, scoreViafAlt = 0

                    if (viafNameLookup[x].nameLc) scoreLc = n.name.score(viafNameLookup[x].nameLc, 0.5)
                    if (viafNameLookup[x].nameViaf) scoreViaf = n.name.score(viafNameLookup[x].nameViaf, 0.5)
                    if (viafNameLookup[x].nameViafAlt) scoreViafAlt = n.name.score(viafNameLookup[x].nameViafAlt, 0.5)

                    if (scoreLc > threshold || scoreViaf > threshold || scoreViafAlt > threshold) {
                      var newScore = (scoreLc >= scoreViaf) ? scoreLc : scoreViaf
                      if (scoreViafAlt > newScore) newScore = scoreViafAlt

                      // console.log(n.name, " | ", viafNameLookup[x].nameLc, " > ",scoreLc)
                      if (newScore > bestScore) bestMatch = x
                    }
                  }

                  if (bestMatch) {
                    for (var y in newNames) {
                      if (newNames[y].name == n.name) {
                        newNames[y].matchedViaf = bestMatch

                        // console.log('---------',bib._id)
                        // console.log(newNames[y].name, " === ", viafNameLookup[bestMatch],bestScore)

                      }
                    }
                  }
                }
              })

              var dupeCheck = {}

              newNames.forEach(function (n) {
                if (n.matchedViaf) {
                  if (dupeCheck[n.matchedViaf + n.relator.toString()]) {
                    hasDupe = true
                  } else {
                    dupeCheck[n.matchedViaf + n.relator.toString()] = true
                  }
                }
              })
            }

            var dupeCheckViaf = {}

            newNames.forEach(function (n) {
              if (n.viafId) {
                if (!dupeCheckViaf[n.viafId]) dupeCheckViaf[n.viafId] = 0
                dupeCheckViaf[n.viafId]++
              }
              if (n.matchedViaf) {
                if (!dupeCheckViaf[n.matchedViaf]) dupeCheckViaf[n.matchedViaf] = 0
                dupeCheckViaf[n.matchedViaf]++
              }
            })

            // console.log("dupeCheckViaf",dupeCheckViaf)

            viafDupe = false
            viafDupeCheck++

            for (var i in dupeCheckViaf) {
              if (dupeCheckViaf[i] > 1) {
                viafDupe = true
                threshold = threshold + 0.5
              // console.log("HAS DUPE VIAF, increading threshold!",threshold)
              }
            }
          }

          if (hasDupe) {
            console.log('\n\nRecord still contains dupes:', bib._id, '\n\n')
          }

          // lets make a list of all the viaf that we did find
          var empolyedViaf = []

          newNames.forEach(function (n) {
            if (n.viafId) if (empolyedViaf.indexOf(n.viafId) == -1) empolyedViaf.push(n.viafId)
            if (n.matchedViaf) if (empolyedViaf.indexOf(n.matchedViaf) == -1) empolyedViaf.push(n.matchedViaf)
          })
          var unusedViaf = []

          // console.log("unusedViaf",unusedViaf)

          viafIds.forEach(function (n) {
            if (empolyedViaf.indexOf(n) == -1) unusedViaf.push(n)
          })

          if (unusedViaf.length != 0) {
            // console.log("Did not match local to anything:")
            // newNames.forEach(function(n){
            // 	if (!n.viafId && !n.matchedViaf) console.log("\t",n.name)
            // })

            // console.log("Did not find local name for viaf:",bib._id,"\n")

            // unusedViaf.forEach(function(n){
            // 	console.log("\t",n,viafNameLookup[n])
            // })

            // console.log(newNames)

            // console.log("==============")

            // if (newNames.length == 1 && unusedViaf.length == 1){

            // 	for (var y in newNames){
            // 		if (!newNames[y].matchedViaf && !newNames[y].viafId){

            // 			console.log("Mapping",newNames[y],"to",unusedViaf,viafNameLookup[unusedViaf[0]])

            // 			//newNames[y].matchedViaf = unusedViaf[0]

            // 			//unusedViaf = []
            // 		}
            // 	}
            // }

          }

          // console.log(newNames)
          //  		console.log(viafIds)
          //  		console.log(viafNameLookup)
          //  		console.log(unusedViaf)

          // at this point everything that we can map is mapped, build the final agents field
          var agents = []

          // console.log("newNames:",newNames)

          newNames.forEach(function (n) {
            var a = {}

            a.nameLocal = n.name
            a.relator = n.relator
            a.type = n.type
            a.contributor = n.contributor

            if (n.relator) {
              if (relatorsCodes[n.relator]) {
                relatorsCodes[n.relator]++
              } else {
                relatorsCodes[n.relator] = 1
              }
            }

            countTotalNames++

            // did we match it to viaf ourselves?
            if (n.viafId) {
              // yes
              a.nameLc = (viafNameLookup[n.viafId]) ? viafNameLookup[n.viafId].nameLc : false
              a.nameViaf = (viafNameLookup[n.viafId]) ? viafNameLookup[n.viafId].nameViaf : false
              a.viaf = n.viafId

              countFoundInLC++
            }else if (n.matchedViaf) {
              // with help from worldcat or classify
              a.nameLc = (viafNameLookup[n.matchedViaf]) ? viafNameLookup[n.matchedViaf].nameLc : false
              a.nameViaf = (viafNameLookup[n.matchedViaf]) ? viafNameLookup[n.matchedViaf].nameViaf : false
              a.viaf = n.matchedViaf

              countFoundInViafViaOclc++
            } else {
              // we did not match it at all
              a.nameLc = false
              a.nameViaf = false
              a.viaf = false
              countLocal++
            }

            if (a.nameLc === '') a.nameLc = false
            if (a.nameViaf === '') a.nameViaf = false

            agents.push(a)
          })

          // now we need to take care of any un matched viaf results
          unusedViaf.forEach(function (v) {
            if (viafNameLookup[v]) {
              n = viafNameLookup[v]

              countTotalNames++

              var a = {}

              a.nameLocal = false
              a.relator = false
              a.type = false
              a.contributor = n.contributor
              a.nameLc = n.nameLc
              a.nameViaf = n.nameViaf

              a.viaf = v

              if (a.nameLc === '') a.nameLc = false
              if (a.nameViaf === '') a.nameViaf = false
              countAddedUnmatchedNames++

              agents.push(a)
            }
          })

          agents = qualityControl(agents)

          // console.log(bib._id)
          // console.log(agents)

          var update = {
            id: bib._id,
            'sc:agents': agents
          }

          db.updateBibRecord(update, function () {
            cursor.resume()
          }, mongoConnection)
        })
      } else {
        var agents = [], viafIds = []

        newNames.forEach(function (n) {
          countTotalNames++

          var a = {}

          a.nameLocal = n.name
          a.relator = n.relator
          a.type = n.type
          a.contributor = n.contributor

          if (n.relator) {
            if (relatorsCodes[n.relator]) {
              relatorsCodes[n.relator]++
            } else {
              relatorsCodes[n.relator] = 1
            }
          }

          // did we match it to viaf ourselves?
          if (n.viafId) {
            viafIds.push(n.viafId)

            // yes
            a.nameLc = n.viafName
            a.nameViaf = false
            a.viaf = n.viafId

            countFoundInLC++

            if (newNames.length == externalViafMatches.length && externalViafMatches.indexOf(n.viafId) == -1) {
              // super edge case, if there is one match and we are saying it is a differnt VIAF based on our own LC match, go with the external data
              if (newNames.length == 1) {
                if (externalViafMatches.indexOf(n.viafId) == -1) {
                  // console.log(externalViafMatches)
                  // can we grab the world cat?
                  if (bib['wc:creator']) {
                    if (bib['wc:creator'][0]) {
                      a.nameLc = n.name
                      a.nameViaf = bib['wc:creator'][0].name
                      a.viaf = bib['wc:creator'][0].id
                    }
                  }
                }
              }
            }
          }

          if (a.nameLc === '') a.nameLc = false
          if (a.nameViaf === '') a.nameViaf = false

          agents.push(a)
        })

        // we are relaying on the labels to be correct comming from worldcat/classify, lets double check them agains our local viaf
        viaf.find({ _id: {$in: viafIds } }).toArray(function (err, viafAry) {
          viafAry.forEach(function (v) {
            for (var a in agents) {
              if (agents[a].viaf == v._id) {
                agents[a].nameLc = v.lcTerm
                agents[a].nameViaf = v.viafTerm
              }
            }
          })

          // console.log('\n\n\n---------',bib._id,bib['sc:oclc'],bib['classify:oclc'],bib['lc:oclc'])

          // console.log(agents)

          agents = qualityControl(agents)
          // console.log("\n")
          // console.log(bib._id)
          // console.log(agents)

          var update = {
            id: bib._id,
            'sc:agents': agents
          }

          db.updateBibRecord(update, function () {
            cursor.resume()
          }, mongoConnection)
        })
      }
    })
  })
})
