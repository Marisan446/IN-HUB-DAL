const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const readProductStatusController = require("./productstatus.controller")
const readProductTypeController = require("./producttype.controller")

const ReadProductStatusController = new readProductStatusController()
const ReadProductTypeController = new readProductTypeController()

module.exports = class ProductAPIController {


    async CreateProduct(req, res) {


        let ProductStatusrequest = {
            body: {
                ProductStatusCode: req.body.ProductStatus.ProductStatusCode
            }
        }
        const readProductStatus = await ReadProductStatusController.readProductStatus(ProductStatusrequest, res)


        let ProductTyperequest = {
            body: {
                ProductStatusCode: req.body.ProductType.ProductTypeCode
            }
        }
        const readProductType = await ReadProductTypeController.readProductType(ProductTyperequest, res)
  

    }
 


}