const express = require('express');
const Router = express.Router();

const RequestStatusAPIController = require("../controllers/requeststatus.controller");

const requeststatusAPIController = new RequestStatusAPIController
Router.post('/create', requeststatusAPIController.createRequestStatus);
Router.post('/read', requeststatusAPIController.readRequestStatus)
Router.post('/update', requeststatusAPIController.updateRequestStatus);

module.exports = Router;