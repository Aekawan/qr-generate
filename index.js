const express = require('express')
const multer = require('multer');
const path = require('path');

const app = express()
const port = process.env.PORT || 3000;
const pdfController = require('./Controller/pdf')
const creditCardController = require('./Controller/creditCard')

app.use(express.static(__dirname + '/public'));
app.use(cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },

  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage })

app.get('/pdf', pdfController.pdf)
app.post('/card-scanner', upload.single('image'), creditCardController.ocr)
app.get('/', (req, res) => res.json({ message: 'running' }))

app.listen(port, () => console.log(`app listening on port ${port}!`))
