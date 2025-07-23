app.get('/updateProduct/:id', checkAuthenticated, checkAdmin, (req, res) => {
    const productId = req.params.id;
    const sql = 'SELECT * FROM products WHERE productId = ?';

    connection.query(sql , [productId], (error, results) => {
        if (error) throw error;

        if (results.length > 0) {
            res.render('updateProduct', { product: results[0] }); // This shows the edit form
        } else {
            res.status(404).send('Product not found');
        }
    });
});

app.post('/updateProduct/:id', upload.single('image'), (req, res) => {
    const productId = req.params.id;
    const { name, quantity, price } = req.body;
    let image = req.body.currentImage; 

    if (req.file) { 
        image = req.file.filename; // If user uploads new image, use it
    } 

    const sql = 'UPDATE products SET productName = ?, quantity = ?, price = ?, image = ? WHERE productId = ?';

    connection.query(sql, [name, quantity, price, image, productId], (error, results) => {
        if (error) {
            console.error("Error updating product:", error);
            res.status(500).send('Error updating product');
        } else {
            res.redirect('/inventory');
        }
    });
});
