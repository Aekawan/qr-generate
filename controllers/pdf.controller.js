const PDFDocument = require('pdfmake')
const axios = require('axios')
const path = require('path')
var Module = require('module');
var fs = require('fs');

Module._extensions['.png'] = function (module, fn) {
  var base64 = fs.readFileSync(fn).toString('base64');
  module._compile('module.exports="data:image/png;base64,' + base64 + '"', fn);
};

const qrPosition = require('../qr4.json')
const bg = require('../new_qr_template.png')

module.exports.pdf = async (req, res, next) => {
  var pdfDocument = new PDFDocument;

  const url = `http://customer.lacartemenu.com/?res_id=${req.query.id}`;
  const qrCodeSize = '157x157';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrCodeSize}&data=${url}`;

  try {
    var result = await axios.get(qrCodeUrl, {
      responseType: 'arraybuffer'
    })
  } catch (err) {
    return next(err.message)
  }

  var image = new Buffer.from(result.data, 'base64')

  const createQr = qrPosition.map(({ x, y }) => ({
    image: image,
    width: 157,
    absolutePosition: { x, y }
  }))

  var doc = pdfDocument.createPdfKitDocument({
    info: {
      title: 'QR Code',
      author: 'QR Code',
      subject: 'QR Code',
    },
    content: [{
      image: bg,
      width: 595,
      absolutePosition: { x: 0, y: 0 }
    },
    ...createQr
    ],
  })

  let qrCodePdf;
  doc.pipe(qrCodePdf = fs.createWriteStream('./assets/pdf/qr-code.pdf'), { encoding: 'utf8' });

  doc.end();

  qrCodePdf.on('finish', async function () {
    res.download('./assets/pdf/qr-code.pdf');
  });
}