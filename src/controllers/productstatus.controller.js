const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = class ProductStatusAPIController {
    async createProductStatus(req, res) {
        try {
            const { ProductStatusName, ProductStatusCode } = req.body;

            // Validation
            if (!ProductStatusName || !ProductStatusCode) {
                return res.status(400).json({ success: false, message: 'ProductStatusName and ProductStatusCode are required' });
            }

            const existingProductStatus = await prisma.ProductStatus.findFirst({
                where: {
                    ProductStatusCode: ProductStatusCode.toUpperCase(),
                    IsDeleted: false
                }
            });

            if (existingProductStatus) {
                return res.status(409).json({ success: false, message: 'ProductStatus code already exists' });
            }

            const currentUser = req.user || { UserID: null, Username: 'System' };

            const newProductStatus = await prisma.ProductStatus.create({
                data: {
                    ProductStatusName,
                    ProductStatusCode: ProductStatusCode.toUpperCase(),
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

            return res.status(201).json({ success: true, message: 'ProductStatus created successfully', data: newProductStatus });

        } catch (error) {
            console.error('Error creating ProductStatus:', error);

            // Handle Prisma unique constraint error
            if (error.code === 'P2002') {
                return res.status(409).json({ success: false, message: 'ProductStatus code already exists' });
            }

            return res.status(500).json({ success: false, message: 'Failed to create ProductStatus', error: error.message });
        }
    };

    async readProductStatus(req, res) {
        try {
            const { page = 1, limit = 10, search, ProductStatusName, ProductStatusCode } = req.body;

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
                    { ProductStatusName: { contains: search, mode: 'insensitive' } },
                    { ProductStatusCode: { contains: search, mode: 'insensitive' } }
                ];
            }

            // Specific field filters
            if (ProductStatusName) {
                where.ProductStatusName = { contains: ProductStatusName, mode: 'insensitive' };
            }

            if (ProductStatusCode) {
                where.ProductStatusCode = { contains: ProductStatusCode, mode: 'insensitive' };
            }

            // Get total count and data in parallel
            const [total, ProductStatuss] = await Promise.all([
                prisma.ProductStatus.count({ where }),
                prisma.ProductStatus.findMany({
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
                success: true, message: 'ProductStatuss retrieved successfully', data: ProductStatuss,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            });

        } catch (error) {
            console.error('Error fetching ProductStatuss:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch ProductStatuss', error: error.message });
        }
    };

    async updateProductStatus(req, res) {
        try {
            const { ProductStatusID, ProductStatusName, ProductStatusCode } = req.body;

            // Validate ProductStatusID
            if (!ProductStatusID || isNaN(parseInt(ProductStatusID))) {
                return res.status(400).json({ success: false, message: 'Valid ProductStatusID is required' });
            }

            const ProductStatusId = parseInt(ProductStatusID);

            // Check if at least one field is provided for update
            if (!ProductStatusName && !ProductStatusCode) {
                return res.status(400).json({ success: false, message: 'At least one field (ProductStatusName or ProductStatusCode) is required for update' });
            }

            // Check if ProductStatus exists
            const existingProductStatus = await prisma.ProductStatus.findUnique({
                where: { ProductStatusID: ProductStatusId }
            });

            if (!existingProductStatus) {
                return res.status(404).json({ success: false, message: 'ProductStatus not found' });
            }

            // Check if ProductStatus is deleted
            if (existingProductStatus.IsDeleted) {
                return res.status(400).json({ success: false, message: 'Cannot update a deleted ProductStatus' });
            }

            // If ProductStatusCode is being updated, check if new code already exists
            if (ProductStatusCode) {
                const codeExists = await prisma.ProductStatus.findFirst({
                    where: {
                        ProductStatusCode: ProductStatusCode.toUpperCase(),
                        ProductStatusID: { not: ProductStatusId },
                        IsDeleted: false
                    }
                });

                if (codeExists) {
                    return res.status(400).json({ success: false, message: 'ProductStatus code already exists' });
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
            if (ProductStatusName) {
                updateData.ProductStatusName = ProductStatusName;
            }

            if (ProductStatusCode) {
                updateData.ProductStatusCode = ProductStatusCode.toUpperCase();
            }

            // Update ProductStatus
            const updatedProductStatus = await prisma.ProductStatus.update({
                where: { ProductStatusID: ProductStatusId },
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

            return res.status(200).json({ success: true, message: 'ProductStatus updated successfully', data: updatedProductStatus });

        } catch (error) {
            console.error('Error updating ProductStatus:', error);

            // Handle Prisma unique constraint error
            if (error.code === 'P2002') {
                return res.status(400).json({ success: false, message: 'ProductStatus code already exists' });
            }

            // Handle record not found error
            if (error.code === 'P2025') {
                return res.status(404).json({ success: false, message: 'ProductStatus not found' });
            }

            return res.status(500).json({ success: false, message: 'Failed to update ProductStatus', error: error.message });
        }
    };
}



