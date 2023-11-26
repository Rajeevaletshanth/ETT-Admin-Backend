require('dotenv').config();
const transporter = require('../services/nodemailer/mailer');
require('dotenv').config();

const Card = require('../models/card');
const Product = require('../models/product');
const PaymentCustomer = require('../models/paymentCustomer');

const stripe = require('stripe')(process.env.STRIPE_SECRET)

const getPaymentCustomerId = async (admin_id) => {
    try {
        const customer = await PaymentCustomer.findAll({
            where:{
                admin_id:admin_id
            }
        })
        return customer[0].customer_id
    } catch (error) {
        return null
    }
}

const getProduct = async (product_id) => {
    try {
        const product = await Product.findAll({
            where:{
                product_id:product_id
            }
        })
        return product[0]
    } catch (error) {
        return null
    }
}

const createInvoice = async (products_det, customerId) => {
    let invoiceItems = [];
    try {
        products_det.map(async(item, key) => {
            let product = await getProduct(item.product_id);   
            invoiceItems[key] = await stripe.invoiceItems.create({
                customer: customerId,
                price: product.price_id,
                quantity: item.quantity
            });                    
        })  
        console.log(invoiceItems)
        return invoiceItems
    } catch (error) {
        console.log(error)
        return false
    }
}

const createPaymentIntent = async (amount, currency, customer_id, payment_method_id, receipt_email) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100,
            currency: currency,
            customer: customer_id,
            payment_method_types: ['card'],
            receipt_email: receipt_email
          });

        const confirmPayment = await stripe.paymentIntents.confirm(
            paymentIntent.id,
            {payment_method: payment_method_id}
        );

        return confirmPayment;
    } catch (error) {
        return null
    }
}

// const payByCard = async() => {

// }

module.exports = {

    //Not finished
    create_draft_invoice: async (req, res) => {

        const admin_id = req.body.admin_id;
        const products_det = req.body.products_det;
        // const quantity = req.body.quantity;
        const currency = req.body.currency;

        try {
            await Card.findAll({
                where:{
                    admin_id: admin_id,
                    primary_card: true
                }
            }).then(async(response) =>{
                if(response.length > 0){
                    const customerId = await getPaymentCustomerId(response[0].admin_id);
                    const invoiceItems = await createInvoice(products_det, customerId);
                    // const invoiceItems = await stripe.invoiceItems.list();
                    res.json({response:"success", data: invoiceItems})
                }else{
                    res.json({response:"error", message: "No cards found!"})
                }
            })

        } catch (error) {
            res.json({response: "error", message: "Undefined error occured", error: [error]})
        }       
        
    },

    direct_payment: async (req, res) => {
        const admin_id = req.body.admin_id;
        const amount = req.body.amount;
        const card_id = req.body.card_id;
        const currency = req.body.currency;
        const receipt_email = req.body.receipt_email;

        try {
            await Card.findAll({
                where:{
                    admin_id: admin_id,
                    card_id: card_id
                }
            }).then(async(response) =>{
                if(response.length > 0){
                    const customerId = await getPaymentCustomerId(admin_id);
                    const paymentIntent = await createPaymentIntent(amount, currency, customerId, response[0].payment_method_id, receipt_email)
                    res.json({response:"success", message: "Payment successfull.", data: paymentIntent})
                }else{
                    res.json({response:"error", message: "No card found!"})
                }
            })
        } catch (error) {
            res.json({response:"error", message: 'Payment failure.', error: [error]})
        }            
    },


    //Not finished
    checkout_session: async (req, res) => {
        try {
            const session = await stripe.checkout.sessions.create({
                success_url: `${process.env.CLIENT_URL}/success`,
                cancel_url: `${process.env.CLIENT_URL}/cancel`,
                client_reference_id: 'cus_MoeQhH1x6l5bJu',
                line_items: [
                  {price: 'price_1M5Cd8CwlEWy2kFVQFQ5cyOn', quantity: 2},
                ],
                mode: 'payment',
            });

            res.json({response: "success", message: "Checkout session successful", data: session})
        } catch (error) {
            res.json({response:"error", message: 'Checkout session failure', error: [error]})
        }
    }
    
}