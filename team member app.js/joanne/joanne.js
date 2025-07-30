app.get('/addNewRequest', checkAuthenticated, checkAdmin, (req, res) => {
    res.render('addRequest', {
        user: req.session.user,
        errors: [],
        messages: [],
        formData: {}
    });
});

app.post('/addNewRequest', (req, res) => {
    const { name, taskType, description, urgency, requestStatus } = req.body;

    // Basic validation example (you can expand this)
    const errors = [];
    if (!name || !taskType || !description || !urgency || !requestStatus) {
        errors.push('All fields are required.');
    }

    if (errors.length > 0) {
        // If validation fails, re-render the form with errors and previous inputs
        res.render('addRequest', {
            user: req.session.user,
            errors,
            messages: [],
            formData: { name, taskType, description, urgency, requestStatus }
        });
        return; // Stop execution here
    }

    const sql = 'INSERT INTO requests (elderName, taskType, description, urgency, requestStatus) VALUES (?, ?, ?, ?, ?)';

    connection.query(sql, [name, taskType, description, urgency, requestStatus], (error, results) => {
        if (error) {
            console.error("Error adding request:", error);
            // Render with error message, keeping form data
            res.render('addRequest', {
                user: req.session.user,
                errors: ['Database error: Unable to add request. Please try again later.'],
                messages: [],
                formData: { name, taskType, description, urgency, requestStatus }
            });
        } else {
            // Success: redirect or show success message
            res.redirect('/'); // or you could render with a success message
        }
    });
});
