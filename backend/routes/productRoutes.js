const express = require("express");

const {
  addProduct,
  getProducts,
  getMyProducts,
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
// GET LOGGED-IN FARMER'S PRODUCTS
// ===============================
router.get("/my-products", protect, getMyProducts);

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