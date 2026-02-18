const express = require('express');
const Router = express.Router();

const ProductTypeAPIController = require("../controllers/producttype.controller");

const producttypeAPIController = new ProductTypeAPIController
Router.post('/create', producttypeAPIController.createProductType);
Router.post('/read', producttypeAPIController.readProductType)
Router.post('/update', producttypeAPIController.updateProductType);

module.exports = Router;