const express = require('express');
const Router = express.Router();

const ProductStatusAPIController = require("../controllers/productstatus.controller");

const productstatusAPIController = new ProductStatusAPIController
Router.post('/create', productstatusAPIController.createProductStatus);
Router.post('/read', productstatusAPIController.readProductStatus)
Router.post('/update', productstatusAPIController.updateProductStatus);

module.exports = Router;