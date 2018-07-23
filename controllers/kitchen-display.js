module.exports = (app, connectionObject, io) => {
    // controller for kitchen display page
    app.get('/kitchenDisplay', (req, res) => {

        if (!connectionObject.isDbConnected) {
            connectionObject.connection = connectionObject.mongoose.createConnection(connectionObject.dbConnectionString, {
                useNewUrlParser: true
            });
            connectionObject.FoodOrderData = connectionObject.connection.model('FoodOrderData', connectionObject.foodSchema);
            connectionObject.isDbConnected = true;
        }

        connectionObject.FoodOrderData.find({}, (error, results) => {
            if (error) throw error;

            if (connectionObject.isDbConnected) {
                connectionObject.connection.close();
                connectionObject.isDbConnected = false;
            }

            res.render('kitchen-display', {
                results: results
            });

        });

    });

    // socket connection for updating kitchen display table
    io.on('connection', (socket) => {

        socket.on('broadcastKitchen', (data) => {

            if (!connectionObject.isDbConnected) {
                connectionObject.connection = connectionObject.mongoose.createConnection(connectionObject.dbConnectionString, {
                    useNewUrlParser: true
                });
                connectionObject.FoodOrderData = connectionObject.connection.model('FoodOrderData', connectionObject.foodSchema);
                connectionObject.isDbConnected = true;
            }

            connectionObject.FoodOrderData.update({
                '_id': data.productId,
                'Quantity': { $gt: 0 }
            }, {
                $inc: {
                    Quantity: -1,
                    CreatedTillNow: 1
                }
            }, (err) => {

                if (err) throw err;

                connectionObject.FoodOrderData.find({
                        '_id': data.productId
                    },
                    '_id Quantity CreatedTillNow', (error, results) => {
                        if (error) throw error;

                        io.sockets.emit('broadcastKitchen', {
                            'quantity': results[0]['Quantity'],
                            'createdTillNow': results[0]['CreatedTillNow'],
                            'productId': results[0]['_id']
                        });

                        if (connectionObject.isDbConnected) {
                            connectionObject.connection.close();
                            connectionObject.isDbConnected = false;
                        }

                    });

            });

        });

        socket.on('disconnect', () => {
            console.log('Socket closed');
        });

    });


};