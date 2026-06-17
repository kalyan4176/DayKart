import express from 'express';
import { createTicket, getMyTickets, getAdminTickets, addReply, resolveTicket } from '../controllers/supportController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect); // protect all support ticket routes

router.post('/', restrictTo('customer'), createTicket);
router.get('/my-tickets', restrictTo('customer'), getMyTickets);
router.get('/admin-tickets', restrictTo('admin'), getAdminTickets);

router.post('/:id/reply', addReply);
router.post('/:id/resolve', resolveTicket);

export default router;
