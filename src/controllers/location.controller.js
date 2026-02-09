const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = class LocationAPIController {
    async createLocation(req, res) {
        try {
            const { LocationName, LocationCode } = req.body;

            // Validation
            if (!LocationName || !LocationCode) {
                return res.status(400).json({ success: false, message: 'LocationName and LocationCode are required' });
            }

            const existingLocation = await prisma.location.findFirst({
                where: {
                    LocationCode: LocationCode.toUpperCase(),
                    IsDeleted: false
                }
            });

            if (existingLocation) {
                return res.status(409).json({ success: false, message: 'Location code already exists' });
            }

            const currentUser = req.user || { UserID: null, Username: 'System' };

            const newLocation = await prisma.location.create({
                data: {
                    LocationName,
                    LocationCode: LocationCode.toUpperCase(),
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

            return res.status(201).json({ success: true, message: 'Location created successfully', data: newLocation });

        } catch (error) {
            console.error('Error creating location:', error);

            // Handle Prisma unique constraint error
            if (error.code === 'P2002') {
                return res.status(409).json({ success: false, message: 'Location code already exists' });
            }

            return res.status(500).json({ success: false, message: 'Failed to create location', error: error.message });
        }
    };

    async readLocation(req, res) {
        try {
            const { page = 1, limit = 10, search, LocationName, LocationCode } = req.body;

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
                    { LocationName: { contains: search, mode: 'insensitive' } },
                    { LocationCode: { contains: search, mode: 'insensitive' } }
                ];
            }

            // Specific field filters
            if (LocationName) {
                where.LocationName = { contains: LocationName, mode: 'insensitive' };
            }

            if (LocationCode) {
                where.LocationCode = { contains: LocationCode, mode: 'insensitive' };
            }

            // Get total count and data in parallel
            const [total, locations] = await Promise.all([
                prisma.location.count({ where }),
                prisma.location.findMany({
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
                success: true, message: 'Locations retrieved successfully', data: locations,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            });

        } catch (error) {
            console.error('Error fetching locations:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch locations', error: error.message });
        }
    };

    async updateLocation(req, res) {
        try {
            const { LocationID, LocationName, LocationCode } = req.body;

            // Validate LocationID
            if (!LocationID || isNaN(parseInt(LocationID))) {
                return res.status(400).json({ success: false, message: 'Valid LocationID is required' });
            }

            const locationId = parseInt(LocationID);

            // Check if at least one field is provided for update
            if (!LocationName && !LocationCode) {
                return res.status(400).json({ success: false, message: 'At least one field (LocationName or LocationCode) is required for update' });
            }

            // Check if location exists
            const existingLocation = await prisma.location.findUnique({
                where: { LocationID: locationId }
            });

            if (!existingLocation) {
                return res.status(404).json({ success: false, message: 'Location not found' });
            }

            // Check if location is deleted
            if (existingLocation.IsDeleted) {
                return res.status(400).json({ success: false, message: 'Cannot update a deleted location' });
            }

            // If LocationCode is being updated, check if new code already exists
            if (LocationCode) {
                const codeExists = await prisma.location.findFirst({
                    where: {
                        LocationCode: LocationCode.toUpperCase(),
                        LocationID: { not: locationId },
                        IsDeleted: false
                    }
                });

                if (codeExists) {
                    return res.status(400).json({ success: false, message: 'Location code already exists' });
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
            if (LocationName) {
                updateData.LocationName = LocationName;
            }

            if (LocationCode) {
                updateData.LocationCode = LocationCode.toUpperCase();
            }

            // Update location
            const updatedLocation = await prisma.location.update({
                where: { LocationID: locationId },
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

            return res.status(200).json({ success: true, message: 'Location updated successfully', data: updatedLocation });

        } catch (error) {
            console.error('Error updating location:', error);

            // Handle Prisma unique constraint error
            if (error.code === 'P2002') {
                return res.status(400).json({ success: false, message: 'Location code already exists' });
            }

            // Handle record not found error
            if (error.code === 'P2025') {
                return res.status(404).json({ success: false, message: 'Location not found' });
            }

            return res.status(500).json({ success: false, message: 'Failed to update location', error: error.message });
        }
    };
}



