const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = class UserRoleAPIController {
    async createUserRole(req, res) {
        try {
            const { UserRoleName, UserRoleCode } = req.body;

            // Validation
            if (!UserRoleName || !UserRoleCode) {
                return res.status(400).json({ success: false, message: 'UserRoleName and UserRoleCode are required' });
            }

            const existingUserRole = await prisma.UserRole.findFirst({
                where: {
                    UserRoleCode: UserRoleCode.toUpperCase(),
                    IsDeleted: false
                }
            });

            if (existingUserRole) {
                return res.status(409).json({ success: false, message: 'UserRole code already exists' });
            }

            const currentUser = req.user || { UserID: null, Username: 'System' };

            const newUserRole = await prisma.UserRole.create({
                data: {
                    UserRoleName,
                    UserRoleCode: UserRoleCode.toUpperCase(),
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

            return res.status(201).json({ success: true, message: 'UserRole created successfully', data: newUserRole });

        } catch (error) {
            console.error('Error creating UserRole:', error);

            // Handle Prisma unique constraint error
            if (error.code === 'P2002') {
                return res.status(409).json({ success: false, message: 'UserRole code already exists' });
            }

            return res.status(500).json({ success: false, message: 'Failed to create UserRole', error: error.message });
        }
    };

    async readUserRole(req, res) {
        try {
            const { page = 1, limit = 10, search, UserRoleName, UserRoleCode } = req.body;

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
                    { UserRoleName: { contains: search, mode: 'insensitive' } },
                    { UserRoleCode: { contains: search, mode: 'insensitive' } }
                ];
            }

            // Specific field filters
            if (UserRoleName) {
                where.UserRoleName = { contains: UserRoleName, mode: 'insensitive' };
            }

            if (UserRoleCode) {
                where.UserRoleCode = { contains: UserRoleCode, mode: 'insensitive' };
            }

            // Get total count and data in parallel
            const [total, UserRoles] = await Promise.all([
                prisma.UserRole.count({ where }),
                prisma.UserRole.findMany({
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
                success: true, message: 'UserRoles retrieved successfully', data: UserRoles,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            });

        } catch (error) {
            console.error('Error fetching UserRoles:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch UserRoles', error: error.message });
        }
    };

    async updateUserRole(req, res) {
        try {
            const { UserRoleID, UserRoleName, UserRoleCode } = req.body;

            // Validate UserRoleID
            if (!UserRoleID || isNaN(parseInt(UserRoleID))) {
                return res.status(400).json({ success: false, message: 'Valid UserRoleID is required' });
            }

            const UserRoleId = parseInt(UserRoleID);

            // Check if at least one field is provided for update
            if (!UserRoleName && !UserRoleCode) {
                return res.status(400).json({ success: false, message: 'At least one field (UserRoleName or UserRoleCode) is required for update' });
            }

            // Check if UserRole exists
            const existingUserRole = await prisma.UserRole.findUnique({
                where: { UserRoleID: UserRoleId }
            });

            if (!existingUserRole) {
                return res.status(404).json({ success: false, message: 'UserRole not found' });
            }

            // Check if UserRole is deleted
            if (existingUserRole.IsDeleted) {
                return res.status(400).json({ success: false, message: 'Cannot update a deleted UserRole' });
            }

            // If UserRoleCode is being updated, check if new code already exists
            if (UserRoleCode) {
                const codeExists = await prisma.UserRole.findFirst({
                    where: {
                        UserRoleCode: UserRoleCode.toUpperCase(),
                        UserRoleID: { not: UserRoleId },
                        IsDeleted: false
                    }
                });

                if (codeExists) {
                    return res.status(400).json({ success: false, message: 'UserRole code already exists' });
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
            if (UserRoleName) {
                updateData.UserRoleName = UserRoleName;
            }

            if (UserRoleCode) {
                updateData.UserRoleCode = UserRoleCode.toUpperCase();
            }

            // Update UserRole
            const updatedUserRole = await prisma.UserRole.update({
                where: { UserRoleID: UserRoleId },
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

            return res.status(200).json({ success: true, message: 'UserRole updated successfully', data: updatedUserRole });

        } catch (error) {
            console.error('Error updating UserRole:', error);

            // Handle Prisma unique constraint error
            if (error.code === 'P2002') {
                return res.status(400).json({ success: false, message: 'UserRole code already exists' });
            }

            // Handle record not found error
            if (error.code === 'P2025') {
                return res.status(404).json({ success: false, message: 'UserRole not found' });
            }

            return res.status(500).json({ success: false, message: 'Failed to update UserRole', error: error.message });
        }
    };
}



