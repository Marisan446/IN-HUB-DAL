// Importing necessary libraries and modules
const express = require('express');
const cors = require('cors');
const app = express();
const basicAuth = require("express-basic-auth");
const Common = require('./utils/commons');
const EndPoint = require('./utils/endpoint')

// Creating objects of the utility classes
const commons = new Common();
const endpoint = new EndPoint()

// Exporting the app to be used in the server setup
module.exports = app;
