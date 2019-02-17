let promise = require('promise');
let request = require('request');
let cheerio = require('cheerio');
let fs = require('fs');

let promises = [];
let promisesOne = [];
let hotels = [];
let count = 1;

function fillHotels(url) {
    return new Promise(function (resolve, reject) {
        request(url, function (err, res, html) {
            if (err) {
                console.log(err);
                return reject(err);
            } else if (res.statusCode !== 200) {
                err = new Error("Unexpected status code : " + res.statusCode);
                err.res = res;
                return reject(err);
            }

            let $ = cheerio.load(html);
            let frenchHotels = $('h3:contains("France")').next();
            frenchHotels.find('li').length;
            frenchHotels.find('li').each(function () {
                let data = $(this);
                let url = String(data.find('a').attr("href"));
                let name = data.find('a').first().text();
                name = name.replace(/\n/g, "");
                let chiefName = String(data.find('a:contains("Chef")').text().split(' - ')[1]);
                chiefName = chiefName.replace(/\n/g, "");
                hotels.push({
                    "name": name.trim(),
                    "postalCode": "",
                    "chef": chiefName.trim(),
                    "url": url,
                    "price": ""
                })
            });
            resolve(hotels);
        })
    })
}

function getHotelInfo(url, index) {
    return new Promise(function (resolve, reject) {
        request(url, function (err, res, html) {
            if (err) {
                console.error(err);
                return reject(err);
            } else if (res.statusCode !== 200) {
                err = new Error("Unexepected status code : " + res.statusCode);
                err.res = res;
                return reject(err);
            }

            const $ = cheerio.load(html);
            $('span[itemprop="postalCode"]').first().each(function () {
                let data = $(this);
                let postalC = data.text();
                hotels[index].postalCode = String(postalC.split(',')[0]).trim();
            });
            $('.price').first().each(function () {
                let data = $(this);
                let price = data.text();
                hotels[index].price = String(price);
            });

            console.log("Postal code and price of #" + index + " hotel added to list");
            resolve(hotels);
        })
    })
}

function newPromise() {
    let url = 'https://www.relaischateaux.com/fr/site-map/etablissements';
    promises.push(fillHotels(url));
    console.log("List of hotels completed");
}

function newPromises() {
    return new Promise(function (resolve) {
        if (count === 1) {
            for (let i = 0; i < Math.trunc(hotels.length / 2); i++) {
                let hotelURL = hotels[i].url;
                promisesOne.push(getHotelInfo(hotelURL, i));
                console.log("Url of #" + i + " hotel to the promises list");
            }
            resolve();
            count++;
        } else if (count === 2) {
            for (let i = hotels.length / 2; i < Math.trunc(hotels.length); i++) {
                let hotelURL = hotels[i].url;
                promisesOne.push(getHotelInfo(hotelURL, i));
                console.log("Url of #" + i + " hotel to the promises list");
            }
            resolve();
        }
    })
}

function createJSON() {
    return new Promise(function (resolve) {
        try {
            console.log("Writing JSON file...");
            let json = JSON.stringify(hotels);
            fs.writeFile("RC_List.json", json, function doneWriting(err) {
                if (err) {
                    console.log(err);
                }
            });
        } catch (error) {
            console.error(error);
        }
        resolve();
    });
}

newPromise();
let pr = promises[0];
pr
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

module.exports.getRC_List = function () {
    return JSON.parse(fs.readFileSync("RC_List.json"));
}