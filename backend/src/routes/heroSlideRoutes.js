import express from 'express';
import { getHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide } from '../controllers/heroSlideController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

// Public route to fetch slides
router.get('/', getHeroSlides);

// Admin-only CRUD routes
router.use(protect, restrictTo('admin'));
router.post('/', createHeroSlide);
router.patch('/:id', updateHeroSlide);
router.delete('/:id', deleteHeroSlide);

export default router;
