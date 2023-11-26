require('dotenv').config();
const transporter = require('../services/nodemailer/mailer');
require('dotenv').config();

const Product = require('../models/product')

const stripe = require('stripe')(process.env.STRIPE_SECRET)

module.exports = {

    create_product: async (req, res) => {
        const product_name = req.body.product_name;
        const price = req.body.price;
        const image = req.body.image;
        const currency = req.body.currency; //eur

        try {
            const product = await stripe.products.create({
                name: product_name
            });

            const setPrice = await stripe.prices.create({
                unit_amount: price * 100,
                currency: currency,
                product: product.id,
            });

            const newProduct = new Product({
                name: product_name,
                product_id: product.id,
                price_id: setPrice.id,
                product_type: "one time purchase",
                price: setPrice.unit_amount,
                image: image
            })
            await newProduct.save()

            res.json({response: "success", message: "Product created successfully.", data: newProduct})
        } catch (error) {
            res.json({response: "error", message: "Product not added!", error: [error]})
        }        
    },

    create_subscription: async (req, res) => {
        // const product_name = req.body.product_name;
        // const price = req.body.price;
        // const image = req.body.image;
        // const interval = req.body.interval; //month, year
        // const currency = req.body.currency; //eur

        // try {
        //     const product = await stripe.products.create({
        //         name: product_name,
        //     });

        //     const setPrice = await stripe.prices.create({
        //         unit_amount: price * 100,
        //         currency: currency,
        //         recurring: {interval: interval},
        //         product: product.id,
        //     });

        //     const newProduct = new Product({
        //         name: product_name,
        //         product_id: product.id,
        //         price_id: setPrice.id,
        //         product_type: "subscription",
        //         price: setPrice.unit_amount,
        //         image: image
        //     })
        //     await newProduct.save()

        //     res.json({response: "success", message: "Subscription created successfully.", data: newProduct})
        // } catch (error) {
        //     res.json({response: "error", message: "Subscription not added!", error: [error]})
        // }
    },

    remove_product: async(req, res) => {
        const product_id = req.body.product_id;
        // const is_deleted = true;
        try {
            await Product.findAll({
                where:{
                    product_id: product_id
                }
            }).then(async(response) => {
                if(response.length > 0){
                    const product = await Product.update({
                        is_deleted : true
                    },
                    {
                        where: {
                            product_id: product_id
                        }
                    })
                    if(product[0] > 0){
                        const setInactive = await stripe.products.update(product_id, {active: false});
                        res.json({response: "success", message: "Product removed successfully.", data: setInactive})
                    }else{
                        res.json({response:"error", message: "Product not removed!"})
                    }
                                        
                }else{
                    res.json({response:"error", message: "Product not found!"})
                }
            })
        } catch (error) {
            res.json({response: "error", message: "Product not removed!", error: [error]})
        }
    },
    
}