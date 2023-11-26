const Sequelize = require('sequelize');
const database = require('../db_connect');


const Upload = database.define('upload', {

        // attributes
        id:{
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        file:{
            type: Sequelize.STRING,
            allowNull: false,
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

module.exports= Upload;