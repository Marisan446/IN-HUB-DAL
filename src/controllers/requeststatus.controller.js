const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = class RequestStatusAPIController {
    async createRequestStatus(req, res) {
        try {
            const { RequestStatusName, RequestStatusCode } = req.body;

            // Validation
            if (!RequestStatusName || !RequestStatusCode) {
                return res.status(400).json({ success: false, message: 'RequestStatusName and RequestStatusCode are required' });
            }

            const existingRequestStatus = await prisma.RequestStatus.findFirst({
                where: {
                    RequestStatusCode: RequestStatusCode.toUpperCase(),
                    IsDeleted: false
                }
            });

            if (existingRequestStatus) {
                return res.status(409).json({ success: false, message: 'RequestStatus code already exists' });
            }

            const currentUser = req.user || { UserID: null, Username: 'System' };

            const newRequestStatus = await prisma.RequestStatus.create({
                data: {
                    RequestStatusName,
                    RequestStatusCode: RequestStatusCode.toUpperCase(),
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

            return res.status(201).json({ success: true, message: 'RequestStatus created successfully', data: newRequestStatus });

        } catch (error) {
            console.error('Error creating RequestStatus:', error);

            // Handle Prisma unique constraint error
            if (error.code === 'P2002') {
                return res.status(409).json({ success: false, message: 'RequestStatus code already exists' });
            }

            return res.status(500).json({ success: false, message: 'Failed to create RequestStatus', error: error.message });
        }
    };

    async readRequestStatus(req, res) {
        try {
            const { page = 1, limit = 10, search, RequestStatusName, RequestStatusCode } = req.body;

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
                    { RequestStatusName: { contains: search, mode: 'insensitive' } },
                    { RequestStatusCode: { contains: search, mode: 'insensitive' } }
                ];
            }

            // Specific field filters
            if (RequestStatusName) {
                where.RequestStatusName = { contains: RequestStatusName, mode: 'insensitive' };
            }

            if (RequestStatusCode) {
                where.RequestStatusCode = { contains: RequestStatusCode, mode: 'insensitive' };
            }

            // Get total count and data in parallel
            const [total, RequestStatuss] = await Promise.all([
                prisma.RequestStatus.count({ where }),
                prisma.RequestStatus.findMany({
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
                success: true, message: 'RequestStatuss retrieved successfully', data: RequestStatuss,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            });

        } catch (error) {
            console.error('Error fetching RequestStatuss:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch RequestStatuss', error: error.message });
        }
    };

    async updateRequestStatus(req, res) {
        try {
            const { RequestStatusID, RequestStatusName, RequestStatusCode } = req.body;

            // Validate RequestStatusID
            if (!RequestStatusID || isNaN(parseInt(RequestStatusID))) {
                return res.status(400).json({ success: false, message: 'Valid RequestStatusID is required' });
            }

            const RequestStatusId = parseInt(RequestStatusID);

            // Check if at least one field is provided for update
            if (!RequestStatusName && !RequestStatusCode) {
                return res.status(400).json({ success: false, message: 'At least one field (RequestStatusName or RequestStatusCode) is required for update' });
            }

            // Check if RequestStatus exists
            const existingRequestStatus = await prisma.RequestStatus.findUnique({
                where: { RequestStatusID: RequestStatusId }
            });

            if (!existingRequestStatus) {
                return res.status(404).json({ success: false, message: 'RequestStatus not found' });
            }

            // Check if RequestStatus is deleted
            if (existingRequestStatus.IsDeleted) {
                return res.status(400).json({ success: false, message: 'Cannot update a deleted RequestStatus' });
            }

            // If RequestStatusCode is being updated, check if new code already exists
            if (RequestStatusCode) {
                const codeExists = await prisma.RequestStatus.findFirst({
                    where: {
                        RequestStatusCode: RequestStatusCode.toUpperCase(),
                        RequestStatusID: { not: RequestStatusId },
                        IsDeleted: false
                    }
                });

                if (codeExists) {
                    return res.status(400).json({ success: false, message: 'RequestStatus code already exists' });
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
            if (RequestStatusName) {
                updateData.RequestStatusName = RequestStatusName;
            }

            if (RequestStatusCode) {
                updateData.RequestStatusCode = RequestStatusCode.toUpperCase();
            }

            // Update RequestStatus
            const updatedRequestStatus = await prisma.RequestStatus.update({
                where: { RequestStatusID: RequestStatusId },
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

            return res.status(200).json({ success: true, message: 'RequestStatus updated successfully', data: updatedRequestStatus });

        } catch (error) {
            console.error('Error updating RequestStatus:', error);

            // Handle Prisma unique constraint error
            if (error.code === 'P2002') {
                return res.status(400).json({ success: false, message: 'RequestStatus code already exists' });
            }

            // Handle record not found error
            if (error.code === 'P2025') {
                return res.status(404).json({ success: false, message: 'RequestStatus not found' });
            }

            return res.status(500).json({ success: false, message: 'Failed to update RequestStatus', error: error.message });
        }
    };
}



