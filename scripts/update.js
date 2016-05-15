"use strict";
const fs = require('fs')
const path = require('path')
const hb = require('handlebars')
const parse = require('csv-parse/lib/sync')
const states = require('../assets/js/states')
const template = hb.compile(fs.readFileSync('./partials/bathrooms-list-template.hbs').toString())
const _ = require('lodash')

// Get the bathrooms file
const bathroomsList = path.resolve('./assets/csv/bathrooms-list.csv');

let templateData = parseCsv()
console.log(template(templateData))

function parseCsv () {
  const csv = fs.readFileSync('./assets/csv/bathrooms-list.csv')
    .toString()

  // List of all the bathrooms
  const bathrooms = parse( csv, { columns: true, relax_column_count: true } )

  // Unique list of all the cities we have bathrooms for
  const cities = _(bathrooms)
    .map(b => b.city)
    .uniq()
    .value()

  // For every state...
  for (let state of states) {
    state.cities = []
    state.slug = state.name.toLowerCase().replace(/\s/, '-')
    state.name = state.name.toLowerCase()
      .split(' ')
      .map(word => word.slice(0,1).toUpperCase() + word.slice(1))
      .join(' ')

    // Get all the bathrooms
    let stateBathrooms = _.filter(bathrooms, { state: state.abbreviation })
    // Partition the list by city
    let byCity = _.groupBy(stateBathrooms, 'city')

    // And add each city list to the state list
    _.forEach(byCity, (bathrooms, city) => {
      state.cities.push({
        city: city,
        bathrooms: bathrooms.map( (b) => {
          if ( b.linkType == 'instagram' ) {
            b.instagram = true;
          } else if ( b.linkType == 'facebook' ) {
            b.facebook = true;
          } else if ( b.linkType !== 'twitter' ) {
            b.twitter = true;
          } else if ( b.linkType !== 'www' ) {
            b.www = true;
          }

          return b;
        })
      })
    })
  }

  // Filter all of the states without any bathrooms yet
  return {
    states: _.filter(states, state => state.cities.length !== 0 )
  }
}

