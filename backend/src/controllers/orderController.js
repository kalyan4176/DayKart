import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Payment from '../models/Payment.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Seller from '../models/Seller.js';
import { logAuditEvent } from '../services/auditService.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/customErrors.js';

export const checkout = async (req, res, next) => {
  try {
    const { addressId, couponCode, gateway } = req.body;

    // 1. Get customer address
    const address = req.user.addresses.find(addr => addr._id.toString() === addressId);
    if (!address) {
      return next(new BadRequestError('Invalid shipping address selected.'));
    }

    // 2. Retrieve persistent cart
    const cart = await Cart.findOne({ customer: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return next(new BadRequestError('Your shopping cart is empty.'));
    }

    // 3. Process items, verify stock and calculate pricing
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.product;
      if (!product || product.status !== 'approved') {
        return next(new BadRequestError(`Product ${product?.title || 'Unknown'} is no longer available.`));
      }

      // If variant is specified, check variant stock
      if (item.variantSku) {
        const variant = product.variants.find(v => v.sku === item.variantSku);
        if (!variant) {
          return next(new BadRequestError(`Product variant ${item.variantSku} not found.`));
        }
        if (variant.inventory < item.quantity) {
          return next(new BadRequestError(`Insufficient stock for variant ${variant.sku}. Available: ${variant.inventory}`));
        }
        subtotal += variant.price * item.quantity;
      } else {
        // Simple product stock check
        if (product.inventory.quantity < item.quantity) {
          return next(new BadRequestError(`Insufficient stock for product ${product.title}. Available: ${product.inventory.quantity}`));
        }
        subtotal += product.price * item.quantity;
      }

      orderItems.push({
        product: product._id,
        variantSku: item.variantSku,
        quantity: item.quantity,
        price: item.variantSku ? product.variants.find(v => v.sku === item.variantSku).price : product.price,
        seller: product.seller,
      });
    }

    // 4. Calculate coupon discount
    let discount = 0;
    let couponDoc = null;
    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (!couponDoc) {
        return next(new BadRequestError('Invalid or expired coupon code.'));
      }
      if (couponDoc.startDate > new Date() || couponDoc.endDate < new Date()) {
        return next(new BadRequestError('Coupon code is not active yet or has expired.'));
      }
      if (subtotal < couponDoc.minOrderValue) {
        return next(new BadRequestError(`Minimum order value of ₹${couponDoc.minOrderValue} required for coupon.`));
      }
      
      // Calculate
      if (couponDoc.discountType === 'percentage') {
        discount = (subtotal * couponDoc.discountValue) / 100;
        if (couponDoc.maxDiscount && discount > couponDoc.maxDiscount) {
          discount = couponDoc.maxDiscount;
        }
      } else if (couponDoc.discountType === 'flat') {
        discount = couponDoc.discountValue;
      } else if (couponDoc.discountType === 'free_shipping') {
        // Free shipping handled below
      }

      // Check overall usage limits
      if (couponDoc.usageLimit && couponDoc.usedCount >= couponDoc.usageLimit) {
        return next(new BadRequestError('Coupon code limit reached.'));
      }
    }

    // 5. Calculate taxes and shipping
    const shippingCharges = subtotal > 1000 || (couponDoc && couponDoc.discountType === 'free_shipping') ? 0 : 99;
    const tax = Math.round(subtotal * 0.18); // 18% GST estimate
    const total = Math.round(subtotal + shippingCharges + tax - discount);

    // 6. Generate IDs
    const orderId = `DK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paymentId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 7. Decrement stocks
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (item.variantSku) {
        const variantIndex = product.variants.findIndex(v => v.sku === item.variantSku);
        product.variants[variantIndex].inventory -= item.quantity;
      } else {
        product.inventory.quantity -= item.quantity;
      }
      await product.save();
    }

    // 8. Create Order
    const order = new Order({
      orderId,
      customer: req.user._id,
      items: orderItems,
      shippingAddress: address,
      billingAddress: address,
      pricing: {
        subtotal,
        shippingCharges,
        discount,
        tax,
        total,
      },
      coupon: couponDoc ? couponDoc._id : undefined,
      status: gateway === 'cod' ? 'placed' : 'pending', // pending payment unless COD
      statusTimeline: [{
        status: gateway === 'cod' ? 'placed' : 'pending',
        message: gateway === 'cod' ? 'Order placed with Cash on Delivery' : 'Order initialized. Awaiting payment.',
      }],
    });

    await order.save();

    // 9. Create Payment Record
    const payment = new Payment({
      paymentId,
      order: order._id,
      customer: req.user._id,
      gateway,
      amount: total,
      status: gateway === 'cod' ? 'pending' : 'pending', // pending gateway callback/success
    });
    await payment.save();

    order.payment = payment._id;
    await order.save();

    // Update coupon count
    if (couponDoc) {
      couponDoc.usedCount += 1;
      await couponDoc.save();
    }

    // 10. Clear Cart
    cart.items = [];
    await cart.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'CUSTOMER_PLACE_ORDER',
      req,
      details: { orderId, total },
    });

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully.',
      data: {
        orderId,
        paymentId,
        total,
        gateway,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('items.product', 'title images price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { orders },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ orderId: id })
      .populate('items.product', 'title images price sku')
      .populate('payment')
      .populate('customer', 'name email phoneNumber')
      .populate('deliveryPartner', 'name phoneNumber');

    if (!order) {
      return next(new NotFoundError('Order not found.'));
    }

    // Verify access rights (customer, seller of item, or admin)
    const isCustomer = order.customer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isDeliveryPartner = order.deliveryPartner?._id?.toString() === req.user._id.toString();

    let isSellerOfItem = false;
    if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ user: req.user._id });
      isSellerOfItem = order.items.some(item => item.seller.toString() === seller?._id?.toString());
    }

    if (!isCustomer && !isAdmin && !isSellerOfItem && !isDeliveryPartner) {
      return next(new ForbiddenError('You do not have access to view this order.'));
    }

    res.status(200).json({
      status: 'success',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ orderId: id });

    if (!order) return next(new NotFoundError('Order not found.'));

    // Customer can cancel only if pending or placed
    if (req.user.role === 'customer' && order.customer.toString() !== req.user._id.toString()) {
      return next(new ForbiddenError('Access denied.'));
    }

    if (order.status !== 'pending' && order.status !== 'placed') {
      return next(new BadRequestError(`Orders cannot be cancelled once they are ${order.status}.`));
    }

    order.status = 'cancelled';
    order.statusTimeline.push({
      status: 'cancelled',
      message: `Cancelled by ${req.user.role === 'customer' ? 'Customer' : 'Store Administrator'}.`,
    });
    await order.save();

    // Restore stock back to inventory
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (item.variantSku) {
        const variantIndex = product.variants.findIndex(v => v.sku === item.variantSku);
        if (variantIndex > -1) {
          product.variants[variantIndex].inventory += item.quantity;
        }
      } else {
        product.inventory.quantity += item.quantity;
      }
      await product.save();
    }

    await logAuditEvent({
      actor: req.user._id,
      action: 'CANCEL_ORDER',
      req,
      details: { orderId: id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Order cancelled successfully.',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerOrders = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) return next(new ForbiddenError('Access denied.'));

    // Retrieve orders that contain items owned by this seller
    const orders = await Order.find({ 'items.seller': seller._id })
      .populate('items.product', 'title images SKU price')
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    // Filter items to show only this seller's products for listing clarity
    const sellerOrders = orders.map(order => {
      const rawOrder = order.toObject();
      rawOrder.items = rawOrder.items.filter(item => item.seller.toString() === seller._id.toString());
      return rawOrder;
    });

    res.status(200).json({
      status: 'success',
      data: { orders: sellerOrders },
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;

    const order = await Order.findOne({ orderId: id });
    if (!order) return next(new NotFoundError('Order not found.'));

    // Authorization checks
    const isAdmin = req.user.role === 'admin';
    const isDeliveryPartner = order.deliveryPartner?.toString() === req.user._id.toString() && req.user.role === 'delivery_partner';
    
    let isSeller = false;
    let sellerDoc = null;
    if (req.user.role === 'seller') {
      sellerDoc = await Seller.findOne({ user: req.user._id });
      isSeller = order.items.some(item => item.seller.toString() === sellerDoc?._id?.toString());
    }

    if (!isAdmin && !isSeller && !isDeliveryPartner) {
      return next(new ForbiddenError('You are not authorized to update this order.'));
    }

    // Progress status
    order.status = status;
    order.statusTimeline.push({
      status,
      message: message || `Status updated by ${req.user.role}.`,
    });
    
    await order.save();

    // If order delivered, credit seller revenue
    if (status === 'delivered') {
      for (const item of order.items) {
        const itemSeller = await Seller.findById(item.seller);
        if (itemSeller) {
          itemSeller.revenue += (item.price * item.quantity);
          await itemSeller.save();
        }
      }
    }

    await logAuditEvent({
      actor: req.user._id,
      action: 'UPDATE_ORDER_STATUS',
      req,
      details: { orderId: id, status },
    });

    res.status(200).json({
      status: 'success',
      message: `Order status updated to ${status}.`,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ deliveryPartner: req.user._id })
      .populate('customer', 'name email phoneNumber')
      .populate('items.product', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { orders },
    });
  } catch (error) {
    next(error);
  }
};

export const assignDeliveryPartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deliveryPartnerId } = req.body;

    const order = await Order.findOne({ orderId: id });
    if (!order) return next(new NotFoundError('Order not found.'));

    const partner = await User.findOne({ _id: deliveryPartnerId, role: 'delivery_partner' });
    if (!partner) return next(new BadRequestError('Invalid delivery partner selected.'));

    order.deliveryPartner = partner._id;
    order.statusTimeline.push({
      status: order.status,
      message: `Delivery partner '${partner.name}' assigned to ship the parcel.`,
    });
    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Delivery partner assigned successfully.',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};
