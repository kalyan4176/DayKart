import SupportTicket from '../models/SupportTicket.js';
import Order from '../models/Order.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/customErrors.js';
import { sendInAppNotification } from '../utils/notificationHelper.js';

export const createTicket = async (req, res, next) => {
  try {
    const { subject, description, orderId, priority } = req.body;

    let orderDocId = null;
    if (orderId) {
      const order = await Order.findOne({ orderId });
      if (order) orderDocId = order._id;
    }

    const ticket = new SupportTicket({
      customer: req.user._id,
      order: orderDocId,
      subject,
      description,
      priority: priority || 'medium',
      messages: [{
        sender: req.user._id,
        text: description,
      }],
    });

    await ticket.save();

    res.status(201).json({
      status: 'success',
      message: 'Support ticket opened successfully.',
      data: { ticket },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ customer: req.user._id })
      .populate('order', 'orderId status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { tickets },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminTickets = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tickets = await SupportTicket.find(filter)
      .populate('customer', 'name email')
      .populate('order', 'orderId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { tickets },
    });
  } catch (error) {
    next(error);
  }
};

export const addReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, attachments } = req.body;

    if (!text) return next(new BadRequestError('Reply message text is required.'));

    const ticket = await SupportTicket.findById(id);
    if (!ticket) return next(new NotFoundError('Ticket not found.'));

    // Authorization check: User must be customer who opened the ticket OR an admin
    const isOwner = ticket.customer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new ForbiddenError('You do not have access to this ticket thread.'));
    }

    // Add reply message
    ticket.messages.push({
      sender: req.user._id,
      text,
      attachments,
    });

    // Update ticket status
    if (isAdmin) {
      ticket.status = 'in_progress';
    } else {
      ticket.status = 'open'; // reopen if customer replies
    }

    await ticket.save();

    if (isAdmin) {
      await sendInAppNotification(
        ticket.customer,
        'support',
        'Support Ticket Reply',
        `Admin: "${text.substring(0, 45)}${text.length > 45 ? '...' : ''}"`,
        '/tickets'
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Reply sent successfully.',
      data: { ticket },
    });
  } catch (error) {
    next(error);
  }
};

export const resolveTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findById(id);

    if (!ticket) return next(new NotFoundError('Ticket not found.'));

    const isOwner = ticket.customer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new ForbiddenError('Unauthorized.'));
    }

    ticket.status = 'resolved';
    ticket.messages.push({
      sender: req.user._id,
      text: '--- Support Ticket Marked Resolved ---',
    });
    
    await ticket.save();

    // Notify the customer that the ticket has been resolved
    await sendInAppNotification(
      ticket.customer,
      'support',
      'Support Ticket Resolved',
      `Your ticket regarding "${ticket.subject}" has been resolved.`,
      '/tickets'
    );

    res.status(200).json({
      status: 'success',
      message: 'Support ticket resolved.',
      data: { ticket },
    });
  } catch (error) {
    next(error);
  }
};
