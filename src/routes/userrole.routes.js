const express = require('express');
const Router = express.Router();

const UserRoleAPIController = require("../controllers/userrole.controller");

const userroleAPIController = new UserRoleAPIController
Router.post('/create', userroleAPIController.createUserRole);
Router.post('/read', userroleAPIController.readUserRole)
Router.post('/update', userroleAPIController.updateUserRole);

module.exports = Router;