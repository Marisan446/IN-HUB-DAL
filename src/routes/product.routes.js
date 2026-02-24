const express = require('express');
const Router = express.Router();

const ProductAPIController = require("../controllers/product.controller.js");

const productAPIController = new ProductAPIController
Router.post('/create', productAPIController.CreateProduct);
module.exports = Router;