const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = class ProductTypeAPIController {
    async createProductType(req, res) {
        try {
            const { ProductTypeName, ProductTypeCode } = req.body;

            // Validation
            if (!ProductTypeName || !ProductTypeCode) {
                return res.status(400).json({ success: false, message: 'ProductTypeName and ProductTypeCode are required' });
            }

            const existingProductType = await prisma.ProductType.findFirst({
                where: {
                    ProductTypeCode: ProductTypeCode.toUpperCase(),
                    IsDeleted: false
                }
            });

            if (existingProductType) {
                return res.status(409).json({ success: false, message: 'ProductType code already exists' });
            }

            const currentUser = req.user || { UserID: null, Username: 'System' };

            const newProductType = await prisma.ProductType.create({
                data: {
                    ProductTypeName,
                    ProductTypeCode: ProductTypeCode.toUpperCase(),
                    CreatedBy: currentUser.Username,
                    CreatedByUserID: currentUser.UserID,
                    CreatedDate: new Date()
                },
                include: {
                    CreatedByUser: {
                        select: {
                            UserID: true,
                            Username: true,
                            Email: true
                        }
                    }
                }
            });

            return res.status(201).json({ success: true, message: 'ProductType created successfully', data: newProductType });

        } catch (error) {
            console.error('Error creating ProductType:', error);

            // Handle Prisma unique constraint error
            if (error.code === 'P2002') {
                return res.status(409).json({ success: false, message: 'ProductType code already exists' });
            }

            return res.status(500).json({ success: false, message: 'Failed to create ProductType', error: error.message });
        }
    };

    async readProductType(req, res) {
        try {
            const { page = 1, limit = 10, search, ProductTypeName, ProductTypeCode } = req.body;

            // Convert to integers
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            // Build where clause for filtering
            const where = {
                IsDeleted: false
            };

            // Search across multiple fields
            if (search) {
                where.OR = [
                    { ProductTypeName: { contains: search, mode: 'insensitive' } },
                    { ProductTypeCode: { contains: search, mode: 'insensitive' } }
                ];
            }

            // Specific field filters
            if (ProductTypeName) {
                where.ProductTypeName = { contains: ProductTypeName, mode: 'insensitive' };
            }

            if (ProductTypeCode) {
                where.ProductTypeCode = { contains: ProductTypeCode, mode: 'insensitive' };
            }

            // Get total count and data in parallel
            const [total, ProductTypes] = await Promise.all([
                prisma.ProductType.count({ where }),
                prisma.ProductType.findMany({
                    where,
                    skip,
                    take: limitNum,
                    orderBy: { CreatedDate: 'desc' },
                    include: {
                        CreatedByUser: {
                            select: {
                                UserID: true,
                                Username: true,
                                Email: true
                            }
                        },
                        ModifiedByUser: {
                            select: {
                                UserID: true,
                                Username: true,
                                Email: true
                            }
                        }
                    }
                })
            ]);

            return res.status(200).json({
                success: true, message: 'ProductTypes retrieved successfully', data: ProductTypes,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            });

        } catch (error) {
            console.error('Error fetching ProductTypes:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch ProductTypes', error: error.message });
        }
    };

    async updateProductType(req, res) {
        try {
            const { ProductTypeID, ProductTypeName, ProductTypeCode } = req.body;

            // Validate ProductTypeID
            if (!ProductTypeID || isNaN(parseInt(ProductTypeID))) {
                return res.status(400).json({ success: false, message: 'Valid ProductTypeID is required' });
            }

            const ProductTypeId = parseInt(ProductTypeID);

            // Check if at least one field is provided for update
            if (!ProductTypeName && !ProductTypeCode) {
                return res.status(400).json({ success: false, message: 'At least one field (ProductTypeName or ProductTypeCode) is required for update' });
            }

            // Check if ProductType exists
            const existingProductType = await prisma.ProductType.findUnique({
                where: { ProductTypeID: ProductTypeId }
            });

            if (!existingProductType) {
                return res.status(404).json({ success: false, message: 'ProductType not found' });
            }

            // Check if ProductType is deleted
            if (existingProductType.IsDeleted) {
                return res.status(400).json({ success: false, message: 'Cannot update a deleted ProductType' });
            }

            // If ProductTypeCode is being updated, check if new code already exists
            if (ProductTypeCode) {
                const codeExists = await prisma.ProductType.findFirst({
                    where: {
                        ProductTypeCode: ProductTypeCode.toUpperCase(),
                        ProductTypeID: { not: ProductTypeId },
                        IsDeleted: false
                    }
                });

                if (codeExists) {
                    return res.status(400).json({ success: false, message: 'ProductType code already exists' });
                }
            }

            // Get current user from request (assuming auth middleware sets req.user)
            const currentUser = req.user || { UserID: null, Username: 'System' };

            // Prepare update data
            const updateData = {
                ModifiedBy: currentUser.Username,
                ModifiedByUserID: currentUser.UserID,
                ModifiedDate: new Date()
            };

            // Add fields to update only if they are provided
            if (ProductTypeName) {
                updateData.ProductTypeName = ProductTypeName;
            }

            if (ProductTypeCode) {
                updateData.ProductTypeCode = ProductTypeCode.toUpperCase();
            }

            // Update ProductType
            const updatedProductType = await prisma.ProductType.update({
                where: { ProductTypeID: ProductTypeId },
                data: updateData,
                include: {
                    CreatedByUser: {
                        select: {
                            UserID: true,
                            Username: true,
                            Email: true
                        }
                    },
                    ModifiedByUser: {
                        select: {
                            UserID: true,
                            Username: true,
                            Email: true
                        }
                    }
                }
            });

            return res.status(200).json({ success: true, message: 'ProductType updated successfully', data: updatedProductType });

        } catch (error) {
            console.error('Error updating ProductType:', error);

            // Handle Prisma unique constraint error
            if (error.code === 'P2002') {
                return res.status(400).json({ success: false, message: 'ProductType code already exists' });
            }

            // Handle record not found error
            if (error.code === 'P2025') {
                return res.status(404).json({ success: false, message: 'ProductType not found' });
            }

            return res.status(500).json({ success: false, message: 'Failed to update ProductType', error: error.message });
        }
    };
}



