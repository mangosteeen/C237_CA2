app.get('/addNewRequest', checkAuthenticated, checkAdmin, (req, res) => {
    res.render('addRequest', {user: req.session.user } ); 
});

app.post('/addNewRequest', (req, res) => {
    // Extract request data from the request body
    const { name, taskType, description, urgency, requestStatus } = req.body;
   
    const sql = 'INSERT INTO requests (elderName, taskType, description, urgency, requestStatus) VALUES (?, ?, ?, ?, ?)';
    // Insert the new request into the database
    connection.query(sql , [name, taskType, description, urgency, requestStatus], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error adding request:", error);
            res.status(500).send('Error adding request');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});