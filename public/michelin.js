let Promise = require('promise');
let request = require('request');
let cheerio = require('cheerio');
let fs = require('fs');

let promises = [];
let promisesOne = [];
let restaurants = [];
let count = 1;

function fillRestaurants(url) {
    return new Promise(function (resolve, reject) {
        request(url, function (err, res, html) {
            if (err) {
                console.error(err);
                return reject(err);
            } else if (res.statusCode !== 200) {
                err = new Error("Unexpected status code : " + res.statusCode);
                err.res = res;
                console.error(err);
                return reject(err);
            }

            let $ = cheerio.load(html);
            $('.poi-card-link').each(function () {
                let data = $(this);
                let link = data.attr("href");
                let url = "https://restaurant.michelin.fr/" + link;
                restaurants.push({
                    "name": "",
                    "postalCode": "",
                    "chef": "",
                    "url": url
                })
            });
            resolve(restaurants);
        });
    });
}

function getRestaurantInfo(url, index) {
    return new Promise(function (resolve, reject) {
        request(url, function (err, res, html) {
            if (err) {
                console.error(err);
                return reject(err);
            } else if (res.statusCode !== 200) {
                err = new Error("Unexpected status code : " + res.statusCode);
                err.res = res;
                console.error(err);
                return reject(err);
            }

            const $ = cheerio.load(html);
            $('.poi_intro-display-title').first().each(function () {
                let data = $(this);
                let name = data.text();
                name = name.replace(/\n/g, "");
                restaurants[index].name = name.trim();
            });

            $('.postal-code').first().each(function () {
                let data = $(this);
                let postalC = data.text();
                restaurants[index].postalCode = postalC;
            });

            $('#node_poi-menu-wrapper > div.node_poi-chef > div.node_poi_description > div.field.field--name-field-chef.field--type-text.field--label-above > div.field__items > div').first().each(function () {
                let data = $(this);
                let chiefName = data.text();
                restaurants[index].chef = chiefName;
            });
            console.log("Added info of #" + index + " restaurant");
            resolve(restaurants);
        });
    });
}

function newPromise() {
    for (let i = 1; i <= 37; i++) {
        let url = 'https://restaurant.michelin.fr/restaurants/france/restaurants-1-etoile-michelin/restaurants-2-etoiles-michelin/restaurants-3-etoiles-michelin/page-' + i.toString();
        promises.push(fillRestaurants(url));
        console.log("Page #" + i + " of Michelin starred restaurants added to list");
    }
}

function newPromises() {
    return new Promise(function (resolve) {
        if (count === 1) {
            for (let i = 0; i < restaurants.length / 2; i++) {
                let restaurantURL = restaurants[i].url;
                promisesOne.push(getRestaurantInfo(restaurantURL, i));
                console.log("URL of #" + i + " restaurant added to promises list");
            }
            resolve();
            count++;
        }
        if (count === 2) {
            for (let i = restaurants.length / 2; i < restaurants.length; i++) {
                let restaurantURL = restaurants[i].url;
                promisesOne.push(getRestaurantInfo(restaurantURL, i));
                console.log("URL of #" + i + " restaurant added to promises list");
            }
            resolve();
        }
    })
}

function createJSON() {
    return new Promise(function(resolve) {
        try {
          console.log("Writing JSON file...");
          let json = JSON.stringify(restaurants);
          fs.writeFile("Michelin_List.json", json, function doneWriting(err) {
            if (err) {
              console.error(err);
            }
          });
        } catch (error) {
          console.error(error);
        }
        resolve();
      });
}

newPromise();
Promise.all(promises)
.then(newPromises)
.then(() => {
    return Promise.all(promisesOne);
})
.then(newPromises)
.then(() => {
    return Promise.all(promisesOne);
})
.then(createJSON)
.then(() => {
    console.log("JSON file created")
});

module.exports.getMichelin_List = function() {
    return JSON.parse(fs.readFileSync("Michelin_List.json"));
}