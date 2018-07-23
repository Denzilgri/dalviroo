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

            const update = {
                Quantity: Number(data.quantity) - 1,
                CreatedTillNow: Number(data.createdTillNow) + 1
            };

            connectionObject.FoodOrderData.update({
                '_id': data.productId
            }, update, (err) => {

                if (err) throw err;

                io.sockets.emit('broadcastKitchen', {
                    'quantity': Number(data.quantity) - 1,
                    'createdTillNow': Number(data.createdTillNow) + 1,
                    'productId': data.productId
                });

                if (connectionObject.isDbConnected) {
                    connectionObject.connection.close();
                    connectionObject.isDbConnected = false;
                }
            });

        });

        socket.on('disconnect', () => {
            console.log('Socket closed');
        });

    });


};