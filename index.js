const express = require('express')
const app = express()
const port = 3000
const pdfController = require('./pdf')

app.get('/pdf', pdfController.pdf)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
