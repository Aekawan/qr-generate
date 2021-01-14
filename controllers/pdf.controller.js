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
const bg = require('../takeoutposter.png')

const generateQR = (type, image, title) => {
  if (type === 'dine-in') {
    const createQr = qrPosition.map(({ x, y }) => ({
      image: image,
      width: 157,
      absolutePosition: { x: x + 0.288, y: y + 0.379 }
    }))
    return [
      ...createQr,
      {
        text: title,
        fontSize: 15,
        absolutePosition: { x: 35, y: 29.79 },
        alignment: 'center'
      }
    ]
  }
  // type === 'take out'
  return [
    {
      image: bg,
      width: 595,
      absolutePosition: { x: 0, y: 0 }
    },
    {
      image: image,
      width: 240,
      absolutePosition: { x: 55.0709, y: 568.0686 }
    }
  ]
}

module.exports.pdf = async (req, res, next) => {

  const fontDescriptors = {
    Roboto: {
      normal: path.join(__dirname, '..', 'assets', '/fonts/NotoSansJP-Regular.otf'),
      bold: path.join(__dirname, '..', 'assets', '/fonts/NotoSansJP-Medium.otf'),
      italics: path.join(__dirname, '..', 'assets', '/fonts/NotoSansJP-Regular.otf'),
      bolditalics: path.join(__dirname, '..', 'assets', '/fonts/NotoSansJP-Regular.otf')
    }
  };

  var pdfDocument = new PDFDocument(fontDescriptors);

  const id = R.pathOr('', ['query', 'id'])(req);
  const code = R.pathOr('', ['query', 'code'])(req);
  const name = R.pathOr('', ['query', 'name'])(req);
  const type = R.pathOr('', ['query', 'type'])(req);
  const typeTitle = type === 'dine-in' ? 'Dine-in' : 'Take out'
  const url = type === 'dine-in' ? `https://table.eateat.app/?res_id=${id}` : `https%3A%2F%2Flacarte.onelink.me%2Fx6nK%3Fpid%3DQR_code%26c%3DRestaurant%2FTakeout%26is_retargeting%3Dtrue%26af_dp%3Dlacartecustomer%3A%2F%2Fmain%2Fexplore%2Frestaurant%2F${id}%2Ftakeout`;
  const qrCodeSize = type === 'dine-in' ? '157x157' : '240x240';
  const qrCodeUrl = `http://api.qrserver.com/v1/create-qr-code/?color=000000&bgcolor=FFFFFF&data=${url}&qzone=1&margin=0&size=${qrCodeSize}&ecc=L`;
  const title = `${name} ${code} ${typeTitle}`
  try {
    var result = await axios.get(qrCodeUrl, {
      responseType: 'arraybuffer'
    })
  } catch (err) {
    return next(err.message)
  }


  var image = new Buffer.from(result.data, 'base64')

  const content = generateQR(type, image, title)

  var doc = pdfDocument.createPdfKitDocument({
    info: {
      title: 'QR Code',
      author: 'QR Code',
      subject: 'QR Code',
    },
    content,
  })

  let qrCodePdf;
  doc.pipe(qrCodePdf = fs.createWriteStream('./assets/pdf/qr-code.pdf'), { encoding: 'utf8' });

  doc.end();

  qrCodePdf.on('finish', async function () {
    res.download('./assets/pdf/qr-code.pdf');
  });
}