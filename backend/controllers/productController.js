const Product = require("../models/Product");
const MSP = require("../models/MSP");

// ===============================
// ADD PRODUCT
// ===============================
const addProduct = async (req, res) => {
  try {
    const {
      cropName,
      quantity,
      state,
      district,
      location,
      description,
    } = req.body;

    // ===============================
    // VALIDATE REQUIRED FIELDS
    // ===============================
    if (
      !cropName ||
      quantity === undefined ||
      !state ||
      !district ||
      !location
    ) {
      return res.status(400).json({
        message: "Please provide all required product details",
      });
    }

    // ===============================
    // VALIDATE QUANTITY
    // ===============================
    if (Number(quantity) <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }

    // ===============================
    // VALIDATE LOCATION
    // ===============================
    if (
      location.latitude === undefined ||
      location.longitude === undefined
    ) {
      return res.status(400).json({
        message: "Valid latitude and longitude are required",
      });
    }

    // ===============================
    // CHECK CURRENT ACTIVE MSP
    // ===============================
    const msp = await MSP.findOne({
      cropName: {
        $regex: `^${cropName.trim()}$`,
        $options: "i",
      },
      isActive: true,
    }).sort({
      year: -1,
      effectiveFrom: -1,
    });

    // ===============================
    // MSP NOT FOUND
    // ===============================
    if (!msp) {
      return res.status(400).json({
        message: "Active MSP not found for this crop",
      });
    }

    // ===============================
    // CREATE PRODUCT
    // ===============================
    const product = await Product.create({
      farmer: req.user.id,
      cropName: msp.cropName,
      quantity: Number(quantity),
      state: state.trim(),
      district: district.trim(),
      location: {
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
      },
      description: description || "",
    });

    // ===============================
    // RESPONSE
    // ===============================
    res.status(201).json({
      message: "Product added successfully",

      product: {
        ...product.toObject(),

        // Current MSP is returned dynamically
        currentMsp: {
          price: msp.mspPrice,
          unit: msp.unit,
          season: msp.season,
          year: msp.year,
        },
      },
    });

  } catch (error) {
    res.status(500).json({
      message: "Product creation failed",
      error: error.message,
    });
  }
};


// ===============================
// GET ALL PRODUCTS
// ===============================
const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("farmer", "name email phone")
      .lean();

    // ===============================
    // ADD CURRENT MSP TO EACH PRODUCT
    // ===============================
    const productsWithCurrentMSP = await Promise.all(
      products.map(async (product) => {
        const msp = await MSP.findOne({
          cropName: {
            $regex: `^${product.cropName.trim()}$`,
            $options: "i",
          },
          isActive: true,
        }).sort({
          year: -1,
          effectiveFrom: -1,
        }).lean();

        return {
          ...product,

          currentMsp: msp
            ? {
                price: msp.mspPrice,
                unit: msp.unit,
                season: msp.season,
                year: msp.year,
              }
            : null,
        };
      })
    );

    res.status(200).json({
      message: "Products fetched successfully",
      products: productsWithCurrentMSP,
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};


// ===============================
// UPDATE PRODUCT
// ===============================
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // ===============================
    // CHECK OWNER
    // ===============================
    if (product.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to update this product",
      });
    }

    // ===============================
    // PREVENT MSP / PRICE MANIPULATION
    // ===============================
    delete req.body.price;
    delete req.body.msp;
    delete req.body.mspPrice;
    delete req.body.mspUnit;
    delete req.body.currentMsp;

    // ===============================
    // PREVENT FARMER FROM CHANGING
    // CROP NAME
    // ===============================
    delete req.body.cropName;

    // ===============================
    // UPDATE PRODUCT
    // ===============================
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("farmer", "name email phone");

    // ===============================
    // GET CURRENT MSP
    // ===============================
    const msp = await MSP.findOne({
      cropName: {
        $regex: `^${updatedProduct.cropName.trim()}$`,
        $options: "i",
      },
      isActive: true,
    }).sort({
      year: -1,
      effectiveFrom: -1,
    }).lean();

    res.status(200).json({
      message: "Product updated successfully",

      product: {
        ...updatedProduct.toObject(),

        currentMsp: msp
          ? {
              price: msp.mspPrice,
              unit: msp.unit,
              season: msp.season,
              year: msp.year,
            }
          : null,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: "Product update failed",
      error: error.message,
    });
  }
};


// ===============================
// DELETE PRODUCT
// ===============================
const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // ===============================
    // CHECK OWNER
    // ===============================
    if (product.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to delete this product",
      });
    }

    await Product.findByIdAndDelete(productId);

    res.status(200).json({
      message: "Product deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: "Product deletion failed",
      error: error.message,
    });
  }
};


// ===============================
// GET SINGLE PRODUCT
// ===============================
const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId)
      .populate("farmer", "name email phone")
      .lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // ===============================
    // GET CURRENT MSP
    // ===============================
    const msp = await MSP.findOne({
      cropName: {
        $regex: `^${product.cropName.trim()}$`,
        $options: "i",
      },
      isActive: true,
    }).sort({
      year: -1,
      effectiveFrom: -1,
    }).lean();

    res.status(200).json({
      message: "Product fetched successfully",

      product: {
        ...product,

        currentMsp: msp
          ? {
              price: msp.mspPrice,
              unit: msp.unit,
              season: msp.season,
              year: msp.year,
            }
          : null,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};


// ===============================
// EXPORT
// ===============================
module.exports = {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getProductById,
};