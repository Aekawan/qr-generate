const express = require('express')
const app = express()
const port = 3000
const pdfController = require('./pdf')

app.get('/pdf', pdfController.pdf)
app.get('/', (req, res) => {
  res.json({ message: 'running' })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
