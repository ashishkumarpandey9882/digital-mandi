const express = require("express");

const {
    createMSP,
    getAllMSP,
    getMSPByCrop,
    updateMSP,
    deactivateMSP
} = require("../controllers/mspController");

const router = express.Router();


// Create new MSP
router.post("/", createMSP);

// Get all active MSP
router.get("/", getAllMSP);

// Get MSP by crop name
router.get("/crop/:cropName", getMSPByCrop);

// Update MSP
router.put("/:id", updateMSP);

// Deactivate MSP
router.patch("/:id/deactivate", deactivateMSP);


module.exports = router;