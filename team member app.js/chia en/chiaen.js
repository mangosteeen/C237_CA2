// Load the edit request form
app.get('/requests/:id/edit', checkAuthenticated, (req, res) => {
    const requestId = req.params.id;
    const sql = 'SELECT * FROM requests WHERE id = ?';

    connection.query(sql, [requestId], (error, results) => {
        if (error) throw error;

        if (results.length > 0) {
            res.render('editRequest', { request: results[0], user: req.session.user }); // Render edit form
        } else {
            res.status(404).send('Request not found');
        }
    });
});

// Submit the edited request
app.post('/requests/:id/update', checkAuthenticated, (req, res) => {
    const requestId = req.params.id;
    const { elder_name, task_type, description, urgency } = req.body;

    const sql = 'UPDATE requests SET elder_name = ?, task_type = ?, description = ?, urgency = ? WHERE id = ?';

    connection.query(sql, [elder_name, task_type, description, urgency, requestId], (error, results) => {
        if (error) {
            console.error("Error updating request:", error);
            res.status(500).send('Error updating request');
        } else {
            res.redirect('/my-requests'); // Redirect to user’s list
        }
    });
});

