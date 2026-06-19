import HeroSlide from '../models/HeroSlide.js';
import { NotFoundError } from '../utils/customErrors.js';

// Get all slides
export const getHeroSlides = async (req, res, next) => {
  try {
    const slides = await HeroSlide.find()
      .populate({
        path: 'products',
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'brand', select: 'name' }
        ]
      })
      .sort({ order: 1 });
      
    res.status(200).json({
      status: 'success',
      data: { slides }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new slide
export const createHeroSlide = async (req, res, next) => {
  try {
    const slide = new HeroSlide(req.body);
    await slide.save();
    
    // Populate before return
    await slide.populate({
      path: 'products',
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'brand', select: 'name' }
      ]
    });

    res.status(201).json({
      status: 'success',
      data: { slide }
    });
  } catch (error) {
    next(error);
  }
};

// Update an existing slide
export const updateHeroSlide = async (req, res, next) => {
  try {
    const slide = await HeroSlide.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate({
      path: 'products',
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'brand', select: 'name' }
      ]
    });

    if (!slide) {
      return next(new NotFoundError('Hero slide not found.'));
    }

    res.status(200).json({
      status: 'success',
      data: { slide }
    });
  } catch (error) {
    next(error);
  }
};

// Delete a slide
export const deleteHeroSlide = async (req, res, next) => {
  try {
    const slide = await HeroSlide.findByIdAndDelete(req.params.id);

    if (!slide) {
      return next(new NotFoundError('Hero slide not found.'));
    }

    res.status(200).json({
      status: 'success',
      message: 'Hero slide deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
