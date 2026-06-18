import express from 'express';
import multer from 'multer';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, importCSVProducts, getCategories, getBrands } from '../controllers/productController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

// Configure multer for memory buffer storage (CSV parsing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // limit to 5MB
});

// Public catalog routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/:id', getProductById);

// Seller/Admin protected catalog updates
router.use(protect);
router.post('/', restrictTo('seller', 'admin'), createProduct);
router.patch('/:id', restrictTo('seller', 'admin'), updateProduct);
router.delete('/:id', restrictTo('seller', 'admin'), deleteProduct);
router.post('/import-csv', restrictTo('seller'), upload.single('file'), importCSVProducts);

export default router;
