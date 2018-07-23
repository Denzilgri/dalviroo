module.exports = (app, urlencodedParser, connectionObject, io) => {

    // controller for prediction of order quantity page
    app.get('/predictOrderQuantity', (req, res) => {

        if (!connectionObject.isDbConnected) {
            connectionObject.connection = connectionObject.mongoose.createConnection(connectionObject.dbConnectionString, {
                useNewUrlParser: true
            });
            connectionObject.FoodOrderData = connectionObject.connection.model('FoodOrderData', connectionObject.foodSchema);
            connectionObject.isDbConnected = true;
        }

        connectionObject.FoodOrderData.find({}, 'Name', (error, results) => {
            if (error) throw error;

            if (connectionObject.isDbConnected) {
                connectionObject.connection.close();
                connectionObject.isDbConnected = false;
            }

            res.render('predict-order-quantity', {
                names: results
            });

        });

    });

    // POST prediction
    app.post('/predictOrderQuantity', urlencodedParser, (req, res) => {
        if (!req.body) return res.sendStatus(400);

        if (!connectionObject.isDbConnected) {
            connectionObject.connection = connectionObject.mongoose.createConnection(connectionObject.dbConnectionString, {
                useNewUrlParser: true
            });
            connectionObject.FoodOrderData = connectionObject.connection.model('FoodOrderData', connectionObject.foodSchema);
            connectionObject.isDbConnected = true;
        }

        connectionObject.FoodOrderData.update({
                Name: req.body.productName
            }, {
                Predicted: Number(req.body.quantity)
            },
            (err, results) => {
                if (err) throw err;
                console.log('Update completed');

                getProductByName(req.body.productName, Number(req.body.quantity), res);
                
            });

    });

    // get product id by name
    function getProductByName(name, quantity, res) {

        connectionObject.FoodOrderData.find({ Name: name }, '_id', (err, results) => {
            if (err) throw err;

            if (connectionObject.isDbConnected) {
                connectionObject.connection.close();
                connectionObject.isDbConnected = false;
            }
    
            io.sockets.emit('updatePredictedValue', {
                predicted: quantity,
                id: results[0]['_id']
            });
    
            return res.redirect('/predictOrderQuantity');

        });
    }

};