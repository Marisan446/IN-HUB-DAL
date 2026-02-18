const express = require('express');
const Router = express.Router();

const ProductAPIController = require("../controllers/product.controller.js");

const locationAPIController = new ProductAPIController
Router.post('/create', locationAPIController.createLocation);
Router.post('/read', locationAPIController.readLocation)
Router.post('/update', locationAPIController.updateLocation);

module.exports = Router;