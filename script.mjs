import { log } from 'console';
import csv from 'csv-parser';
import fs from 'fs';
import fetch from 'node-fetch';

const results = [];

fs.createReadStream('product - Sheet1.csv')
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
        results.push(data);
    })
    .on('end', async () => {
        console.log(results);

        for (let i = 0; i < results.length; i++) {
            let data = results[i];
            let productSKU = data.SKU; // Assuming 'SKU' is the column containing the SKU

            // Fetch existing product data
            let response = await fetch(`https://furniro-qpmzl3qe5a-uc.a.run.app/api/products?SKU=${productSKU}`);
            let existingProduct = await response.json();

            if (existingProduct.length > 0) {
                // Merge existing data with new data
                let updatedData = { ...existingProduct[0], ...data };

                let raw = JSON.stringify({
                    "data": updatedData
                });

                console.log(raw, "RAW");
                let updateResponse = await fetch(`https://furniro-qpmzl3qe5a-uc.a.run.app/api/products/${existingProduct[0].id}`, {
                    "method": "PUT", // Use PUT method to update
                    "headers": { "Content-Type": "application/json" },
                    "body": raw,
                    "redirect": "follow"
                });

                let result = await updateResponse.text();
                console.log(result);
            } else {
                console.log(`Product with SKU ${productSKU} not found.`);
            }
        }
    });
