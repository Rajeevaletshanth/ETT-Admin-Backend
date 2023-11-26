require('dotenv').config();
const transporter = require('../services/nodemailer/mailer');
require('dotenv').config();
const { Op } = require("sequelize");

const Card = require('../models/card');
const PaymentCustomer = require('../models/paymentCustomer');

const stripe = require('stripe')(process.env.STRIPE_SECRET)

module.exports = {

    create_customer: async (req, res) => {
        const name = req.body.name;
        const admin_id = req.body.admin_id;

        try {
            const checkCustomer = await PaymentCustomer.findAll({
                where: {
                    admin_id: admin_id
                }
            })
            if(checkCustomer.length > 0)
                res.send({response: "error", message: "Customer already created!"})
            else{
                const createCustomer = await stripe.customers.create({
                    name: name,
                    description: `${process.env.PROJECT} customer.`
                });

                const customer = new PaymentCustomer({
                        admin_id: admin_id,
                        customer_id: createCustomer.id
                })
                await customer.save()
                res.json({response: "success", message: "Payment method added successfully."})
            }
        } catch (error) {
            res.json({response: "error", message: "Payment method not added!"})
        }
    },

    get_customer_byID: async (req, res) => {
        const { admin_id } = req.params;

        try {
            const customer = await PaymentCustomer.findAll({
                where:{
                    admin_id: admin_id
                }
            })
            if(customer.length > 0){
                res.json({ response: "success", customer: customer })
            }else{
                res.json({ response: "no data", message: "Customer not found!" })
            }
        } catch (error) {
            res.json({ response: "error", message: "No data" })
        }
    },

    attach_payment_method: async (req, res) => {
        const { admin_id } = req.params;
        const customer_name = req.body.customer_name;
        const name = req.body.name;
        const email = req.body.email;
        const type = req.body.type;
        const card_no = req.body.card_no;
        const exp_month = req.body.exp_month;
        const exp_year = req.body.exp_year;
        const cvc = req.body.cvc;
        const cardId = req.body.cardId;
        const last_four_digits = req.body.last4Number;
        const cardType = req.body.cardType;
        const primary_card = req.body.primary_card;

        try {
            const checkCardExists = await Card.findAll({
                where:{
                    admin_id: admin_id,
                    last_four_digits: last_four_digits
                }
            })
            if(checkCardExists.length > 0){
                res.json({response:"error", message:"This card is already exists."})
            }else{
                const paymentMethod = await stripe.paymentMethods.create({
                    type: type,
                    card: {
                        number: card_no,
                        exp_month: exp_month,
                        exp_year: exp_year,
                        cvc: cvc,
                    },
                    billing_details: {
                        name: name,
                    },
                });

                await PaymentCustomer.findAll({
                    where:{
                        admin_id: admin_id
                    }
                }).then(async(response) => {
                    if(response.length > 0){
                        const attachPaymentMethod = await stripe.paymentMethods.attach(
                            paymentMethod.id,
                            {customer: response[0].customer_id}
                        );   

                        if(primary_card){
                            const testCard = await Card.update({
                                primary_card: false
                            },{
                                where: {
                                    admin_id: admin_id
                                }
                            })                           
                        }

                        let setPrimary = false;
                        await Card.findAll({
                            where:{
                                admin_id:admin_id,                  
                            }
                        }).then((cards) => {
                            if(cards.length > 0){
                                setPrimary = primary_card
                            }else{
                                setPrimary = true
                            }
                        })
    
                        const card = new Card({
                            admin_id: admin_id,
                            payment_method_id: paymentMethod.id,
                            card_holder_name: name,
                            card_id: cardId,
                            exp_month: exp_month,
                            exp_year: exp_year,
                            last_four_digits: card_no.substr(card_no.length - 4),
                            card_type: paymentMethod.card.brand,
                            primary_card: setPrimary
                        })
                        await card.save();
    
                        res.json({ response: "success", paymentMethod: attachPaymentMethod, card: card })
                    }else{
                        const createCustomer = await stripe.customers.create({
                            name: customer_name,
                            description: `${process.env.PROJECT} customer.`,
                            email: email
                        });
    
                        const customer = new PaymentCustomer({
                                admin_id: admin_id,
                                customer_id: createCustomer.id
                        })
                        await customer.save()
    
                        const card = new Card({
                            admin_id: admin_id,
                            payment_method_id: paymentMethod.id,
                            card_holder_name: name,
                            card_id: cardId,
                            exp_month: exp_month,
                            exp_year: exp_year,
                            last_four_digits: card_no.substr(card_no.length - 4),
                            card_type: paymentMethod.card.brand,
                            primary_card: true
                        })
                        await card.save();
    
                        const attachPaymentMethod = await stripe.paymentMethods.attach(
                            paymentMethod.id,
                            {customer: createCustomer.id}
                        );
                        
                        res.json({ response: "success", message: attachPaymentMethod, card: card })
                    }
                })
            }
        } catch (error) {
            res.json({ response: "error", message: "Sorry card not found!", error: [error] })
        }
    },

    detach_payment_method: async (req, res) => {
        const { admin_id } = req.params
        const card_id = req.body.card_id;
        let setPrimary = false;

        try {
            await Card.findAll({
                where:{
                    admin_id: admin_id,
                    card_id: card_id
                }
            }).then(async(response) => {
                if(response.length > 0){
                    await stripe.paymentMethods.detach(
                        response[0].payment_method_id
                    );

                    if(response[0].primary_card){
                        setPrimary = true;
                    }
        
                    const card = await Card.destroy({
                        where: {
                            payment_method_id: response[0].payment_method_id
                        }
                    })

                    if(setPrimary){
                        await Card.findAll({
                            where:{
                                admin_id:admin_id
                            }
                        }).then(async(cardResp) => {
                            if(cardResp.length > 0){
                                await Card.update({
                                    primary_card: true
                                },
                                {
                                    where:{
                                        payment_method_id: cardResp[0].payment_method_id
                                    }
                                })
                            }
                        })
                    }

                    res.send({response:"success", message: "Card removed successfully.", card: card})
                }else{
                    res.json({response: "error", message: "Card ID not found!"})
                }
            })           
        } catch (error) {
            res.send({response:"error", message: "Card not found.", error: [error]})
        }       
    },

    get_allcards_byId: async (req, res) => {
        const { admin_id } = req.params;

        try {
            await Card.findAll({
                where:{
                    admin_id: admin_id
                }
            }).then(async(response) => {
                if(response.length > 0){
                    res.send({response: "success", cards: response})
                }else{                   
                    res.send({response:"success", message: "No cards added yet."})
                }
            }).catch((err) => {
                res.send({response:"success", message: "No cards added yet.", error: [err] })
            })
        } catch (error) {
            res.send({response:"error", message: "No data.", error: [error]})
        }
    },

    change_primary_card: async (req, res) => {
        const { admin_id } = req.params;
        const card_id = req.body.card_id;

        try {           
            await Card.update({
                primary_card: true
            },
            {
                where:{
                    card_id: card_id
                }
            }).then(async(response) => {
                if(response[0] > 0){  
                    await Card.update({
                        primary_card: false
                    },{
                        where: {
                            card_id: {
                                [Op.ne]: card_id,
                            }
                        }
                    })
                                    
                    res.json({response: "success", message: "Primary card changed successfully."})
                }else{
                    res.json({response: "error", message: "Primary card not changed."})
                }
            })

        } catch (error) {
            res.json({response: "error", message: "Undefined error occured.", error: [error]})
        }
    }
    
}