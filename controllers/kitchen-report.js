module.exports = (app, connectionObject) => {

    // controller for product orders page
    app.get('/kitchenReport', (req, res) => {

        res.render('kitchen-report');

    });

    // download report
    app.get('/download', (req, res) => {

        if (!connectionObject.isDbConnected) {
            connectionObject.connection = connectionObject.mongoose.createConnection(connectionObject.dbConnectionString, {
                useNewUrlParser: true
            });
            connectionObject.FoodOrderData = connectionObject.connection.model('FoodOrderData', connectionObject.foodSchema);
            connectionObject.isDbConnected = true;
        }

        connectionObject.FoodOrderData.find({}, (error, results) => {
            if (error) throw error;

            console.log('download', results);
            res.setHeader('Content-Disposition', 'attachment; filename=report.txt');
            res.charset = 'UTF-8';

            if (connectionObject.isDbConnected) {
                connectionObject.connection.close();
                connectionObject.isDbConnected = false;
            }

            let report = 'Dish name\tProduced\tPredicted\n';
            results.forEach((product) => {
                report += product.Name + ': ' + product.CreatedTillNow + '\t' + (product.Predicted ? product.Predicted : 'NA') + '\n'
            });
            res.end(report);

        });

    });

};