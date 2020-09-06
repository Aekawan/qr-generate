// const imageRR = require('../63963.jpg')
const vision = require('@google-cloud/vision');
const R = require('ramda');
const fs = require('fs')
const { promisify } = require('util')
const creditCardType = require("credit-card-type");

const unlinkAsync = promisify(fs.unlink)

const replaceAll = (string, search, replace) => {
  return string.split(search).join(replace);
}

const replaceToNumber = (txt) => {
  return R.compose(
    (t) => replaceAll(t, 's', '5'),
    (t) => replaceAll(t, 'S', '5'),
    (t) => replaceAll(t, 'o', '0'),
    (t) => replaceAll(t, 'O', '0'),
    (t) => replaceAll(t, 'l', '1'),
    (t) => replaceAll(t, 'L', '1'),
    (t) => replaceAll(t, 'i', '1'),
    (t) => replaceAll(t, 'I', '1'),
    (t) => replaceAll(t, 'b', '6'),
    (t) => replaceAll(t, 'B', '8'),
    (t) => replaceAll(t, 'Q', '0'),
  )(txt)
}


module.exports.ocr = async (req, res, next) => {
  const image = req.file
  console.log('image', image)
  const client = new vision.ImageAnnotatorClient();
  console.log('client', client)
  try {
    if (!image) throw 'no have image'
    const [result = {}] = await client.documentTextDetection(image.path);
    console.log('result', result);
    const label = R.pathOr('', ['textAnnotations', 0, 'description'])(result);
    const word = label.split('\n')
    const creditCard = word.reduce((acc, item) => {
      const txt = replaceAll(item, ' ', '')

      const cardRegex = /^(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/
      const numberRegex = /[0-9]/

      const cardNumber = replaceToNumber(txt).slice(0, 16)
      const isCardNumber = numberRegex.test(cardNumber)
      const isValidCardNumber = cardRegex.test(cardNumber)
      if (isCardNumber && isValidCardNumber) {
        const cardType = creditCardType(txt.slice(0, 4))
        return {
          ...acc,
          number: cardNumber,
          type: R.pathOr('', ['0', 'type'])(cardType)
        }
      }

      const isExpireDate = txt.includes('/')
      const expireDate = txt.replace(/[^0-9\.]+/g, '')
      if (isExpireDate && expireDate) {
        return {
          ...acc,
          expire: expireDate
        }
      }

      const hasExpire = acc.expire != ''
      const noHaveName = acc.name == ''
      if (hasExpire && noHaveName) {
        return {
          ...acc,
          name: item
        }
      }

      return acc
    }, { number: '', expire: '', name: '', type: '' })
    let status = 'success';
    let errorMsg = ''
    if (creditCard.number == '' || creditCard.expire == '' || creditCard.name == '') {
      status: 'error';
      errorMsg: 'data not valid'
    }
    await unlinkAsync(image.path)
    res.json({ status, errorMsg, result: creditCard })
  } catch (errorMsg) {
    if (errorMsg !== 'no have image') {
      await unlinkAsync(image.path)
    }
    res.json({ status: 'error', errorMsg, result: { number: '', expire: '', name: '', type: '' } })
  }
}