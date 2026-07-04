import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Payment from '../models/Payment.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import ShippingRule from '../models/ShippingRule.js';
import Seller from '../models/Seller.js';
import SystemSetting from '../models/SystemSetting.js';
import { logAuditEvent } from '../services/auditService.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/customErrors.js';
import { sendInAppNotification } from '../utils/notificationHelper.js';


export const checkout = async (req, res, next) => {
  try {
    const { addressId, couponCode, gateway } = req.body;

    // 1. Get customer address
    const address = req.user.addresses.find(addr => addr._id.toString() === addressId);
    if (!address) {
      return next(new BadRequestError('Invalid shipping address selected.'));
    }

    // 2. Retrieve checkout items (from body or persistent cart)
    let cart = null;
    let checkoutItems = [];
    let isBuyNow = false;

    if (req.body.items && req.body.items.length > 0) {
      isBuyNow = true;
      for (const item of req.body.items) {
        const product = await Product.findById(item.product);
        if (!product || product.status !== 'approved') {
          return next(new BadRequestError(`Product is no longer available.`));
        }
        checkoutItems.push({
          product,
          variantSku: item.variantSku,
          quantity: item.quantity,
        });
      }
    } else {
      cart = await Cart.findOne({ customer: req.user._id }).populate('items.product');
      if (!cart || cart.items.length === 0) {
        return next(new BadRequestError('Your shopping cart is empty.'));
      }
      checkoutItems = cart.items;
    }

    // 3. Process items, verify stock and calculate pricing
    let subtotal = 0;
    const orderItems = [];

    for (const item of checkoutItems) {
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

    // Verify minimum order value (dynamic system settings)
    const minCheckoutSetting = await SystemSetting.findOne({ key: 'min_checkout_value' });
    const minCheckoutVal = minCheckoutSetting ? Number(minCheckoutSetting.value) : 0;
    if (subtotal < minCheckoutVal) {
      return next(new BadRequestError(`Minimum order value of ₹${minCheckoutVal} is required to place an order.`));
    }

    const minCodSetting = await SystemSetting.findOne({ key: 'min_cod_value' });
    const minCodVal = minCodSetting ? Number(minCodSetting.value) : 500;
    if (gateway === 'cod' && subtotal < minCodVal) {
      return next(new BadRequestError(`Minimum order value of ₹${minCodVal} is required for Cash on Delivery (COD).`));
    }

    // 4. Calculate coupon discount
    let discount = 0;
    let couponDoc = null;
    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (!couponDoc) {
        return next(new BadRequestError('Coupon code is not available.'));
      }
      const now = new Date();
      const hasStarted = new Date(now.getTime() + 14 * 60 * 60 * 1000) >= couponDoc.startDate;
      const hasExpired = new Date(now.getTime() - 12 * 60 * 60 * 1000) > couponDoc.endDate;
      if (!hasStarted || hasExpired) {
        return next(new BadRequestError('Coupon code is not available.'));
      }
      // Random pool or assignedTo check
      if (couponDoc.isRandomPool || couponDoc.assignedTo) {
        if (!couponDoc.assignedTo || couponDoc.assignedTo.toString() !== req.user._id.toString()) {
          return next(new BadRequestError('Coupon code is not available.'));
        }
      }
      // First N orders check
      if (couponDoc.firstNOrders && couponDoc.firstNOrders > 0) {
        const orderCount = await Order.countDocuments({ customer: req.user._id, status: { $ne: 'cancelled' } });
        if (orderCount >= couponDoc.firstNOrders) {
          return next(new BadRequestError('Coupon code is not available.'));
        }
      }
      // Check overall usage limits
      if (couponDoc.usageLimit && couponDoc.usedCount >= couponDoc.usageLimit) {
        return next(new BadRequestError('Coupon code is not available.'));
      }
      // Min value check
      if (subtotal < couponDoc.minOrderValue) {
        return next(new BadRequestError(`Minimum order value of ₹${couponDoc.minOrderValue} required for coupon.`));
      }
      
      // Calculate
      if (couponDoc.discountType === 'percentage') {
        discount = Math.round((subtotal * couponDoc.discountValue) / 100);
        if (couponDoc.maxDiscount && discount > couponDoc.maxDiscount) {
          discount = couponDoc.maxDiscount;
        }
      } else if (couponDoc.discountType === 'flat') {
        discount = couponDoc.discountValue;
      }
    }

    // 5. Calculate taxes and shipping
    let shippingCharges = 0;
    if (couponDoc && couponDoc.discountType === 'free_shipping') {
      shippingCharges = 0;
    } else {
      const shippingRules = await ShippingRule.find().sort({ minCartValue: 1 });
      if (shippingRules.length === 0) {
        // Fallback to default user logic: 0-150 -> 50, 150-300 -> 20, 300+ -> 0
        if (subtotal <= 150) shippingCharges = 50;
        else if (subtotal < 300) shippingCharges = 20;
        else shippingCharges = 0;
      } else {
        const matchedRule = shippingRules.find(rule => {
          const minMatch = subtotal >= rule.minCartValue;
          const maxMatch = rule.maxCartValue === null || rule.maxCartValue === undefined || subtotal <= rule.maxCartValue;
          return minMatch && maxMatch;
        });
        shippingCharges = matchedRule ? matchedRule.charge : 0;
      }
    }

    // Add COD charge if applicable
    let codCharge = 0;
    if (gateway === 'cod') {
      const codSetting = await SystemSetting.findOne({ key: 'cod_charge' });
      codCharge = codSetting ? Number(codSetting.value) : 0;
      shippingCharges += codCharge;
    }
    
    let taxAccumulator = 0;
    for (const item of checkoutItems) {
      const product = item.product;
      const gstRate = product.gstRate !== undefined ? product.gstRate : 18;
      
      let itemPrice = 0;
      if (item.variantSku) {
        const variant = product.variants.find(v => v.sku === item.variantSku);
        itemPrice = variant ? variant.price : product.price;
      } else {
        itemPrice = product.price;
      }
      
      taxAccumulator += (itemPrice * item.quantity * gstRate) / 100;
    }
    const tax = Math.round(taxAccumulator);
    const total = Math.max(0, Math.round(subtotal + shippingCharges + tax - discount));

    // 6. Generate IDs
    const orderId = `DK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paymentId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 7. Decrement stocks
    for (const item of checkoutItems) {
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
      deliveryOtp: Math.floor(100000 + Math.random() * 900000).toString(),
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

    // Award a random coupon if available in the random pool
    try {
      const randomCoupons = await Coupon.find({ isRandomPool: true, assignedTo: null, active: true, endDate: { $gt: new Date() } });
      if (randomCoupons.length > 0) {
        const chosenCoupon = randomCoupons[Math.floor(Math.random() * randomCoupons.length)];
        chosenCoupon.assignedTo = req.user._id;
        await chosenCoupon.save();
        
        await sendInAppNotification(
          req.user._id,
          'coupon',
          'Surprise Coupon Unlocked!',
          `Congratulations! You received a surprise coupon: "${chosenCoupon.code}". View it in your dashboard coupons section.`,
          '/profile'
        );
      }
    } catch (couponErr) {
      console.error('Error awarding random coupon:', couponErr);
    }

    // Get product details for notification
    const firstProductTitle = checkoutItems[0]?.product?.title || 'Product';
    const itemsCount = checkoutItems.length;
    const itemsDescription = itemsCount > 1 
      ? `"${firstProductTitle}" and ${itemsCount - 1} other item${itemsCount > 2 ? 's' : ''}`
      : `"${firstProductTitle}"`;

    // Send in-app notification to associated sellers
    try {
      const uniqueSellerIds = [...new Set(orderItems.map(item => item.seller.toString()))];
      for (const sId of uniqueSellerIds) {
        const sellerDoc = await Seller.findById(sId);
        if (sellerDoc && sellerDoc.user) {
          const sellerCartItems = checkoutItems.filter(item => item.product?.seller?.toString() === sId);
          if (sellerCartItems.length > 0) {
            const firstItemTitle = sellerCartItems[0].product.title;
            const sellerItemsCount = sellerCartItems.length;
            const sellerItemsDesc = sellerItemsCount > 1
              ? `"${firstItemTitle}" and ${sellerItemsCount - 1} other item${sellerItemsCount > 2 ? 's' : ''}`
              : `"${firstItemTitle}"`;

            const sellerTotal = sellerCartItems.reduce((acc, item) => {
              const price = item.variantSku 
                ? item.product.variants.find(v => v.sku === item.variantSku).price 
                : item.product.price;
              return acc + (price * item.quantity);
            }, 0);

            const totalQty = sellerCartItems.reduce((acc, item) => acc + item.quantity, 0);

            await sendInAppNotification(
              sellerDoc.user,
              'order',
              'New Order Received',
              `You received a new order for ${sellerItemsDesc} (Qty: ${totalQty}). Total value: ₹${sellerTotal.toLocaleString('en-IN')}.`,
              `/seller/dashboard?tab=manage-orders`
            );
          }
        }
      }
    } catch (notifErr) {
      console.error('Error sending seller checkout notifications:', notifErr);
    }

    // 10. Clear Cart if not Buy Now
    if (!isBuyNow && cart) {
      cart.items = [];
      await cart.save();
    }

    // Send in-app notification to customer
    await sendInAppNotification(
      req.user._id,
      'order',
      'Order Placed Successfully',
      `Your order for ${itemsDescription} totaling ₹${total.toLocaleString('en-IN')} has been placed successfully.`,
      `/orders/${orderId}`
    );


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

    const { reason } = req.body;

    order.status = 'cancelled';
    order.statusTimeline.push({
      status: 'cancelled',
      message: reason 
        ? `Cancelled by ${req.user.role === 'customer' ? 'Customer' : 'Store Administrator'}: ${reason}`
        : `Cancelled by ${req.user.role === 'customer' ? 'Customer' : 'Store Administrator'}.`,
    });
    await order.save();

    // Restore stock back to inventory
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
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
    }

    // Fetch product details for notification
    const orderWithProducts = await Order.findOne({ orderId: id }).populate('items.product');
    const firstProductTitle = orderWithProducts?.items?.[0]?.product?.title || 'Product';
    const itemsCount = orderWithProducts?.items?.length || 1;
    const itemsDescription = itemsCount > 1 
      ? `"${firstProductTitle}" and ${itemsCount - 1} other item${itemsCount > 2 ? 's' : ''}`
      : `"${firstProductTitle}"`;

    // Send in-app notification to the customer
    await sendInAppNotification(
      order.customer,
      'order',
      'Order Cancelled',
      `Your order for ${itemsDescription} has been cancelled.`,
      `/orders/${id}`
    );

    // Send in-app notifications to associated sellers
    try {
      const uniqueSellerIds = [...new Set(order.items.map(item => item.seller.toString()))];
      for (const sId of uniqueSellerIds) {
        const sellerDoc = await Seller.findById(sId);
        if (sellerDoc && sellerDoc.user) {
          const sellerItems = orderWithProducts.items.filter(item => item.seller.toString() === sId);
          if (sellerItems.length > 0) {
            const firstItemTitle = sellerItems[0]?.product?.title || 'Product';
            const sellerItemsCount = sellerItems.length;
            const sellerItemsDesc = sellerItemsCount > 1
              ? `"${firstItemTitle}" and ${sellerItemsCount - 1} other item${sellerItemsCount > 2 ? 's' : ''}`
              : `"${firstItemTitle}"`;

            await sendInAppNotification(
              sellerDoc.user,
              'order',
              'Order Cancelled by Customer',
              `The order for ${sellerItemsDesc} has been cancelled by the customer.`,
              `/seller/dashboard?tab=manage-orders`
            );
          }
        }
      }
    } catch (notifErr) {
      console.error('Error sending seller cancellation notifications:', notifErr);
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
      .populate('customer', 'name email phoneNumber')
      .populate('deliveryPartner', 'name phoneNumber email')
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
    let timelineMessage = message;
    if (status === 'cancelled' && req.user.role === 'seller') {
      timelineMessage = message ? `Order rejected by seller: ${message}` : 'Order rejected by seller.';
    } else {
      timelineMessage = message || `Status updated by ${req.user.role}.`;
    }

    const previousStatus = order.status;
    order.status = status;
    order.statusTimeline.push({
      status,
      message: timelineMessage,
    });
    
    await order.save();

    // If order transitioned to cancelled, restore stock to inventory
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
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
      }
    }

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

    // Send in-app notification to the customer about status change
    let statusLabel = status;
    if (status === 'processed') statusLabel = 'approved by seller';
    else if (status === 'shipped') statusLabel = 'shipped';
    else if (status === 'out_for_delivery') statusLabel = 'out for delivery';
    else if (status === 'delivered') statusLabel = 'delivered';
    else if (status === 'cancelled') statusLabel = 'cancelled';

    // Fetch product details for notification
    const orderWithProducts = await Order.findOne({ orderId: id }).populate('items.product');
    const firstProductTitle = orderWithProducts?.items?.[0]?.product?.title || 'Product';
    const itemsCount = orderWithProducts?.items?.length || 1;
    const itemsDescription = itemsCount > 1 
      ? `"${firstProductTitle}" and ${itemsCount - 1} other item${itemsCount > 2 ? 's' : ''}`
      : `"${firstProductTitle}"`;

    await sendInAppNotification(
      order.customer,
      'order',
      `Order Update: ${status === 'processed' ? 'Approved' : status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
      `Your order for ${itemsDescription} status is now ${statusLabel}.`,
      `/orders/${id}`
    );


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
      .populate({
        path: 'items.seller',
        select: 'storeName storeAddress',
        populate: {
          path: 'user',
          select: 'name email phoneNumber'
        }
      })
      .populate('payment')
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

export const returnOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, reason } = req.body;
    const order = await Order.findOne({ orderId: id });

    if (!order) return next(new NotFoundError('Order not found.'));

    if (req.user.role === 'customer' && order.customer.toString() !== req.user._id.toString()) {
      return next(new ForbiddenError('Access denied.'));
    }

    if (order.status !== 'delivered') {
      return next(new BadRequestError('Only delivered orders can be returned or replaced.'));
    }

    order.status = 'returned';
    order.statusTimeline.push({
      status: 'returned',
      message: `Return/Replacement requested by Customer. Type: ${type === 'replace' ? 'Replacement' : 'Return'}. Reason: ${reason || 'None'}.`,
    });
    await order.save();

    // Restore stock back to inventory on order return/replacement
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
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
    }

    // Fetch product details for notification
    const orderWithProducts = await Order.findOne({ orderId: id }).populate('items.product');
    const firstProductTitle = orderWithProducts?.items?.[0]?.product?.title || 'Product';
    const itemsCount = orderWithProducts?.items?.length || 1;
    const itemsDescription = itemsCount > 1 
      ? `"${firstProductTitle}" and ${itemsCount - 1} other item${itemsCount > 2 ? 's' : ''}`
      : `"${firstProductTitle}"`;

    // Send notifications to sellers and customers
    // 1. Notify the customer
    await sendInAppNotification(
      order.customer,
      'Return Request Submitted',
      `Your return/replacement request for ${itemsDescription} has been successfully submitted and is under review.`,
      `/orders/${order.orderId}`
    );

    // 2. Notify sellers
    const uniqueSellers = [...new Set(order.items.map(item => item.seller.toString()))];
    for (const sellerId of uniqueSellers) {
      const sellerProfile = await Seller.findById(sellerId);
      if (sellerProfile) {
        await sendInAppNotification(
          sellerProfile.user,
          'Return/Replacement Requested',
          `Customer has requested a return/replacement for items in order ${order.orderId}. Type: ${type === 'replace' ? 'Replacement' : 'Return'}. Reason: ${reason || 'None'}.`,
          `/seller/dashboard?tab=manage-orders`
        );
      }
    }

    // 3. Notify admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await sendInAppNotification(
        admin._id,
        'Order Return/Replacement Request',
        `Order ${order.orderId} return/replacement requested. Reason: ${reason || 'None'}.`,
        `/orders`
      );
    }

    res.status(200).json({
      status: 'success',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyDeliveryOtp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const order = await Order.findOne({ orderId: id }).populate('payment');
    if (!order) return next(new NotFoundError('Order not found.'));

    if (order.deliveryPartner?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new ForbiddenError('You are not authorized to update this order.'));
    }

    if (order.status !== 'out_for_delivery') {
      return next(new BadRequestError('Order is not out for delivery.'));
    }

    if (!order.deliveryOtp) {
      return next(new BadRequestError('No delivery OTP was generated for this order.'));
    }

    if (order.deliveryOtp !== otp) {
      return next(new BadRequestError('Invalid verification OTP. Please try again.'));
    }

    order.status = 'delivered';
    order.deliveryOtp = null;
    order.statusTimeline.push({
      status: 'delivered',
      message: 'Order delivered successfully. Courier verified delivery OTP.',
    });

    if (order.payment) {
      if (order.payment.paymentMethod === 'cod') {
        order.payment.paymentStatus = 'completed';
        await order.payment.save();
      }
    }

    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Delivery OTP verified successfully. Order status updated to delivered.',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

