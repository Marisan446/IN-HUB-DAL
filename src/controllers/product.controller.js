const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const readProductStatusController = require("./productstatus.controller")
const readProductTypeController = require("./producttype.controller")

const ReadProductStatusController = new readProductStatusController()
const ReadProductTypeController = new readProductTypeController()

module.exports = class ProductAPIController {


    async CreateProduct(req, res) {

        try {
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

            if (readProductStatus && readProductType) {
                const { ProductCode, ProductName, SerialNumber, PurchaseDate, Model } = req.body;

                // Validation
                if (!ProductName || !ProductCode) {
                    return res.status(400).json({ success: false, message: 'ProductName and ProductCode are required' });
                }

                const existingLocation = await prisma.product.findFirst({
                    where: {
                        ProductCode: ProductCode.toUpperCase(),
                        IsDeleted: false
                    }
                });

                if (existingLocation) {
                    return res.status(409).json({ success: false, message: 'Product code already exists' });
                }

                const createdUser = req.body.User.CreatedUser || { UserID: null, UserName: 'System User' };

                const newProduct = await prisma.product.create({
                    data: {
                        ProductName,
                        ProductCode: ProductCode.toUpperCase(),
                        SerialNumber,
                        PurchaseDate,
                        Model,
                        CreatedBy: createdUser.UserName,
                        CreatedByUserID: createdUser.UserID,
                        CreatedDate: new Date()
                    },
                    include: {
                        CreatedByUser: {
                            select: {
                                UserID: true,
                                UserName: true,
                                EmailAddress: true
                            }
                        }
                    }
                });

                return res.status(201).json({ success: true, message: 'Product created successfully', data: newProduct });
            }
        }
        catch (error) {
            console.error('Error creating product:', error);

            // Handle Prisma unique constraint error
            if (error.code === 'P2002') {
                return res.status(409).json({ success: false, message: 'product already exists' });
            }

            return res.status(500).json({ success: false, message: 'Failed to create Product', error: error.message });
        }

    }



}