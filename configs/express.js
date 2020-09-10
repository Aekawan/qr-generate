const express = require('express')
const cors = require('cors')
const path = require('path')

module.exports = async (app) => {

  // CORS
  app.use(cors())

  // Parser Body
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Static file
  app.use('/static', express.static(path.join(__dirname, '../public')))


}