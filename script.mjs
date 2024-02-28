import { log } from 'console';
import csv from 'csv-parser';
import fs from 'fs';
import fetch from 'node-fetch';

const results = [];

fs.createReadStream('Untitled spreadsheet - Sheet1.csv')
    .pipe(csv())
    .on('data', (data) => {
        if (data.products_categories) {
            data.products_categories = JSON.parse(data.products_categories);
        }
        if (data.size) {
            data.size = JSON.parse(data.size);
        }
        if (data.image) {
            data.image = JSON.parse(data.image);
        }
        if (data.product_ranges) {
            data.product_ranges = JSON.parse(data.product_ranges);
        }
        if (data.color) {
            data.color = JSON.parse(data.color);
        }
        if (data.Additional_info) {
            data.Additional_info = JSON.parse(data.Additional_info);
        }

        if (data.price) {
            data.price = parseFloat(data.price.replace(/,/g, ''));
        }
        results.push(data)
    })
    .on('end', async () => {
        console.log(results);


        // myHeaders.append("Content-Type", "application/json");


        // const raw = JSON.stringify({
        //     "data": results
        // });

        // let requestOptions = {
        //     method: "POST",
        //     headers: myHeaders,
        //     body: raw,
        //     redirect: "follow"
        // };


        for (let i = 0; i < results.length; i++) {
            let data = results[i];

            let raw = JSON.stringify({

                data

            }
            );
                 


            // let apilink = 'http://localhost:1337'
            let apilink = 'https://furniro-qpmzl3qe5a-uc.a.run.app'
            console.log(raw, "RAW");
            let response = fetch(`${apilink}/api/products?populate[0]=product_ranges`, {
                "method": "POST",
                // @ts-ignore
                "headers": { "Content-Type": "application/json" },
                "body": raw,

            })
                .then((response) => response.text())
                .then((result) => console.log(result))
                .catch((error) => console.error(error));
        }




    });
