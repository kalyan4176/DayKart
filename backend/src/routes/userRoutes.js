import express from 'express';
import { getProfile, updateProfile, deleteProfile, addAddress, removeAddress, getWishlist, toggleWishlist, getCart, updateCart, getSellerProfile, createSellerProfile, getWallet, getApprovedDeliveryPartners } from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validator.js';
import { addressSchema, sellerProfileSchema } from '../utils/validationSchemas.js';

const router = express.Router();

router.use(protect); // protect all user routes

router.get('/delivery-partners', getApprovedDeliveryPartners);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.delete('/profile', deleteProfile);
router.get('/wallet', getWallet);

router.get('/seller-profile', getSellerProfile);
router.post('/seller-profile', validate(sellerProfileSchema), createSellerProfile);

router.post('/address', validate(addressSchema), addAddress);
router.delete('/address/:addressId', removeAddress);

router.get('/wishlist', getWishlist);
router.post('/wishlist', toggleWishlist);

router.get('/cart', getCart);
router.post('/cart', updateCart);

export default router;
