const castle = require('./castle.js');
const michelin = require('./michelin.js');
let fs = require('fs');

'use strict';

const RelaisChateauJSON = castle.getRC_List();
const MichelinJSON = michelin.getMichelin_List();

function getFusedList(hotels, restaurants) {
    let starredHotels = [];
    for (let i = 0; i < hotels.length; i++) {
        for (let j = 0; j < restaurants.length; j++) {
            if (hotels[i].chef === restaurants[j].chef && hotels[i].postalCode === restaurants[j].postalCode) {
                starredHotels.push({
                    "hotelName": hotels[i].name,
                    "restaurantName": restaurants[j].name,
                    "postalCode": hotels[i].postalCode,
                    "chef": hotels[i].chef,
                    "url": hotels[i].url,
                    "price": hotels[i].price
                })
            }
        }
    }
    return starredHotels;
}

fs.writeFileSync("results.json", JSON.stringify(getFusedList(RelaisChateauJSON, MichelinJSON)), function doneWriting(err) {
    if (err) {
        console.error(err);
    } else {

        console.log("Results written in results.json");
    }
});