const PDFDocument = require('pdfmake')
const axios = require('axios')
const path = require('path')
var Module = require('module');
var fs = require('fs');
const R = require('ramda');

Module._extensions['.png'] = function (module, fn) {
  var base64 = fs.readFileSync(fn).toString('base64');
  module._compile('module.exports="data:image/png;base64,' + base64 + '"', fn);
};

const qrPosition = require('../qr4.json')
const bg = require('../new_qr_template.png')

module.exports.pdf = async (req, res, next) => {

  const fontDescriptors = {
    Roboto: {
      normal: path.join(__dirname, '..', 'assets', '/fonts/Roboto-Regular.ttf'),
      bold: path.join(__dirname, '..', 'assets', '/fonts/Roboto-Medium.ttf'),
      italics: path.join(__dirname, '..', 'assets', '/fonts/Roboto-Italic.ttf'),
      bolditalics: path.join(__dirname, '..', 'assets', '/fonts/Roboto-MediumItalic.ttf')
    }
  };

  var pdfDocument = new PDFDocument(fontDescriptors);

  const id = R.pathOr('', ['query', 'id'])(req);
  const code = R.pathOr('', ['query', 'code'])(req);
  const name = R.pathOr('', ['query', 'name'])(req);
  const url = `http://customer.lacartemenu.com/?res_id=${id}`;
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
    absolutePosition: { x: x + 0.288, y: y + 0.379 }
  }))

  var doc = pdfDocument.createPdfKitDocument({
    info: {
      title: 'QR Code',
      author: 'QR Code',
      subject: 'QR Code',
    },
    content: [...createQr, {
      text: `${name} ${code}`,
      fontSize: 15,
      absolutePosition: { x: 35, y: 29.79 },
      alignment: 'center'
    }],
  })

  let qrCodePdf;
  doc.pipe(qrCodePdf = fs.createWriteStream('./assets/pdf/qr-code.pdf'), { encoding: 'utf8' });

  doc.end();

  qrCodePdf.on('finish', async function () {
    res.download('./assets/pdf/qr-code.pdf');
  });
}