const express = require("express");

const {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ===============================
// ADD PRODUCT
// Only logged-in user
// ===============================
router.post("/", protect, addProduct);

// ===============================
// GET ALL PRODUCTS
// Public
// ===============================
router.get("/", getProducts);

// ===============================
// GET SINGLE PRODUCT
// Public
// ===============================
router.get("/:id", getProductById);

// ===============================
// UPDATE PRODUCT
// Only logged-in farmer
// ===============================
router.put("/:id", protect, updateProduct);

// ===============================
// DELETE PRODUCT
// Only logged-in farmer
// ===============================
router.delete("/:id", protect, deleteProduct);

module.exports = router;