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
const farmerOnly = protect.farmerOnly;

const router = express.Router();

// ===============================
// ADD PRODUCT
// Only logged-in user
// ===============================
router.post("/", protect, farmerOnly, addProduct);

// ===============================
// GET ALL PRODUCTS
// Public
// ===============================
router.get("/", getProducts);

// ===============================
// GET LOGGED-IN FARMER'S PRODUCTS
// ===============================
router.get("/my-products", protect, farmerOnly, getMyProducts);

// ===============================
// GET SINGLE PRODUCT
// Public
// ===============================
router.get("/:id", getProductById);

// ===============================
// UPDATE PRODUCT
// Only logged-in farmer
// ===============================
router.put("/:id", protect, farmerOnly, updateProduct);

// ===============================
// DELETE PRODUCT
// Only logged-in farmer
// ===============================
router.delete("/:id", protect, farmerOnly, deleteProduct);

module.exports = router;