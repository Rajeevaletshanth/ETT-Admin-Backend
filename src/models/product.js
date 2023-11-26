const Sequelize = require('sequelize');
const database = require('../db_connect');

const Product = database.define('product', {

        // attributes
        id:{
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },       

        name:{
            type: Sequelize.STRING,
            allowNull: false,
        },

        product_id: {
            type: Sequelize.STRING,
            allowNull: false
        },

        price_id: {
            type: Sequelize.STRING,
            allowNull: false
        },

        product_type:{
            type: Sequelize.STRING,
            allowNull: false,
        },

        price:{
            type: Sequelize.STRING,
            allowNull: false,
        },

        image:{
            type: Sequelize.STRING,
            allowNull: false,
        },

        is_deleted:{
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


module.exports= Product;