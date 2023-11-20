const Sequelize = require('sequelize');
const database = require('../db_connect');

const Card = database.define('card', {

        // attributes
        id:{
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },       

        admin_id:{
            type: Sequelize.INTEGER,
            allowNull: false,
        },

        payment_method_id: {
            type: Sequelize.STRING,
            allowNull: false
        },

        card_holder_name:{
            type: Sequelize.STRING,
            allowNull: false,
        },

        card_id:{
            type: Sequelize.STRING,
            allowNull: false,
        },

        exp_month:{
            type: Sequelize.STRING,
            allowNull: false,
        },

        exp_year:{
            type: Sequelize.STRING,
            allowNull: false,
        },

        last_four_digits:{
            type: Sequelize.STRING,
            allowNull: false,
        },

        card_type:{
            type: Sequelize.STRING,
            allowNull: false,
        },

        primary_card:{
            type: Sequelize.BOOLEAN
        },

        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at'
        },
    
        updatedAt: {
            type: Sequelize.DATE,
            field: 'updated_at'
        }
    }, {
    // options
    freezeTableName: true
});


module.exports= Card;