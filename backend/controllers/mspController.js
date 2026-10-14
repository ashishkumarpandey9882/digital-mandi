const MSP = require("../models/MSP");

// ========================================
// CREATE MSP
// ========================================

const createMSP = async (req, res) => {
    try {
        const {
            cropName,
            mspPrice,
            unit,
            season,
            year,
            effectiveFrom,
            effectiveTo,
            governmentSource
        } = req.body;

        // Check required fields
        if (
            !cropName ||
            mspPrice === undefined ||
            !season ||
            !year ||
            !effectiveFrom ||
            !governmentSource
        ) {
            return res.status(400).json({
                message: "Please provide all required MSP details"
            });
        }

        // Check if same crop MSP already exists for the same year
        const existingMSP = await MSP.findOne({
            cropName: cropName.trim(),
            year,
            isActive: true
        });

        if (existingMSP) {
            return res.status(400).json({
                message: "Active MSP already exists for this crop and year"
            });
        }

        const msp = await MSP.create({
            cropName: cropName.trim(),
            mspPrice,
            unit: unit || "quintal",
            season,
            year,
            effectiveFrom,
            effectiveTo: effectiveTo || null,
            governmentSource: governmentSource.trim()
        });

        res.status(201).json({
            message: "MSP created successfully",
            msp
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create MSP",
            error: error.message
        });
    }
};


// ========================================
// GET ALL MSP
// ========================================

const getAllMSP = async (req, res) => {
    try {
        const msps = await MSP.find({
            isActive: true
        }).sort({
            year: -1,
            cropName: 1
        });

        res.status(200).json({
            count: msps.length,
            msps
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch MSP",
            error: error.message
        });
    }
};


// ========================================
// GET MSP BY CROP
// ========================================

const getMSPByCrop = async (req, res) => {
    try {
        const { cropName } = req.params;

        const msp = await MSP.findOne({
            cropName: {
                $regex: `^${cropName}$`,
                $options: "i"
            },
            isActive: true
        }).sort({
            year: -1
        });

        if (!msp) {
            return res.status(404).json({
                message: "MSP not found for this crop"
            });
        }

        res.status(200).json({
            msp
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch MSP",
            error: error.message
        });
    }
};


// ========================================
// UPDATE MSP
// ========================================

const updateMSP = async (req, res) => {
    try {
        const { id } = req.params;

        const updatedMSP = await MSP.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedMSP) {
            return res.status(404).json({
                message: "MSP not found"
            });
        }

        res.status(200).json({
            message: "MSP updated successfully",
            msp: updatedMSP
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update MSP",
            error: error.message
        });
    }
};


// ========================================
// DEACTIVATE MSP
// ========================================

const deactivateMSP = async (req, res) => {
    try {
        const { id } = req.params;

        const msp = await MSP.findByIdAndUpdate(
            id,
            {
                isActive: false
            },
            {
                new: true
            }
        );

        if (!msp) {
            return res.status(404).json({
                message: "MSP not found"
            });
        }

        res.status(200).json({
            message: "MSP deactivated successfully",
            msp
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to deactivate MSP",
            error: error.message
        });
    }
};


module.exports = {
    createMSP,
    getAllMSP,
    getMSPByCrop,
    updateMSP,
    deactivateMSP
};