'use strict';

// import modules
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const http = require('http').Server(app);

const io = require('socket.io')(http);

// set port for different envs
let port = process.env.PORT || 3000;

let isDbConnected = false;

let Schema = mongoose.Schema;
let foodSchema = new Schema({
    Name: String,
    Quantity: {
        type: Number,
        min: 0
    },
    CreatedTillNow: {
        type: Number,
        min: 0
    },
    Predicted: {
        type: Number,
        min: 0
    }
});

let connectionObject = {
    foodSchema: foodSchema,
    FoodOrderData: null,
    dbConnectionString: 'mongodb://denzilgri:denzilGri!2@ds135421.mlab.com:35421/denzil-db-instance',
    isDbConnected: isDbConnected,
    mongoose: mongoose,
    connection: null
};

const kitchenDisplayController = require('./controllers/kitchen-display');
const kitchenReport = require('./controllers/kitchen-report');
const predictOrderQuantityController = require('./controllers/predict-order-quantity');
const productOrderController = require('./controllers/product-order');

// set template engine
app.set('view engine', 'ejs');

// change the name of public dir to 'assets' in views
app.use('/assets', express.static(__dirname + '/public'));

// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({
    extended: false
});

// controller for '/'
app.get('/', (req, res) => {

    res.sendFile(__dirname + '/views/index.html');

});

kitchenDisplayController(app, connectionObject, io, urlencodedParser);
kitchenReport(app, connectionObject);
predictOrderQuantityController(app, urlencodedParser, connectionObject, io);
productOrderController(app, urlencodedParser, connectionObject, io);

http.listen(port, () => {
    console.log(`listening on *: ${port}`);
});