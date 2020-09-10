const router = require('express').Router()

const creditCardController = require('../controllers/creditcard.controller')
const pdfController = require('../controllers/pdf.controller')
const upload = require('../helpers/upload.helper')

router.get('/', (_, res) => res.json({ message: 'running' }))
router.get('/pdf', pdfController.pdf)
router.post('/card-scanner', upload.single('image'), creditCardController.ocr)

module.exports = router