const express = require('express');
const Router = express.Router();

const LocationAPIController = require("../controllers/location.controller");

const locationAPIController = new LocationAPIController
Router.post('/create', locationAPIController.createLocation);
Router.post('/read', locationAPIController.readLocation)
Router.post('/update', locationAPIController.updateLocation);

module.exports = Router;