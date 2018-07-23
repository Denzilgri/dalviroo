module.exports = (app, urlencodedParser, connectionObject, io) => {

    // controller for product orders page
    app.get('/productOrder', (req, res) => {

        res.render('product-order', {
            success: false
        });

    });

    // POST /login gets urlencoded bodies
    app.post('/productOrder', urlencodedParser, (req, res) => {
        if (!req.body) return res.sendStatus(400);

        if (!connectionObject.isDbConnected) {
            connectionObject.connection = connectionObject.mongoose.createConnection(connectionObject.dbConnectionString, {
                useNewUrlParser: true
            });
            connectionObject.FoodOrderData = connectionObject.connection.model('FoodOrderData', connectionObject.foodSchema);
            connectionObject.isDbConnected = true;
        }

        connectionObject.FoodOrderData.countDocuments({
            Name: req.body.productName
        }, (err, results) => {
            if (err) throw err;
            if (results > 0) {
                updateQuantity(req.body.productName, req.body.quantity, res, true);
            } else {
                insertProduct(req.body.productName, req.body.quantity, res, false);
            }
        });

    });

    // insert product to the db
    function insertProduct(name, quantity, res, rowExists) {
        const foodOrderData = connectionObject.FoodOrderData({
            Name: name,
            Quantity: quantity,
            CreatedTillNow: 0,
            Predicted: 0,
        });
        foodOrderData.save((err, results) => {
            if (err) throw err;

            console.log('Insert successful');
            selectProduct(name, res, rowExists);
        });
    }

    // update product quantity in the db
    function updateQuantity(name, quantity, res, rowExists) {
        connectionObject.FoodOrderData.update({
                Name: name
            }, {
                $inc: { Quantity: Number(quantity)}
            },
            (err) => {
                if (err) throw err;
                console.log('Update successful');
                selectProduct(name, res, rowExists);
            });
    }

    // emitting the changes to kitchen display table 
    function selectProduct(productName, res, rowExists) {

        connectionObject.FoodOrderData.find({
                Name: productName
            },
            (err, results) => {
                if (err) throw err;
                io.sockets.emit('updateProducts', {
                    product: results[0],
                    exists: rowExists
                });

                if (connectionObject.isDbConnected) {
                    connectionObject.connection.close();
                    connectionObject.isDbConnected = false;
                }

                res.render('product-order', {
                    success: true
                });
            });
    }

};