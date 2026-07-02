import ShippingRule from '../models/ShippingRule.js';
import SystemSetting from '../models/SystemSetting.js';
import { BadRequestError, NotFoundError } from '../utils/customErrors.js';

export const getShippingRules = async (req, res, next) => {
  try {
    const shippingRules = await ShippingRule.find().sort({ minCartValue: 1 });
    res.status(200).json({
      status: 'success',
      data: { shippingRules },
    });
  } catch (error) {
    next(error);
  }
};

export const createShippingRule = async (req, res, next) => {
  try {
    const { minCartValue, maxCartValue, charge } = req.body;

    if (minCartValue === undefined || minCartValue === null || minCartValue < 0) {
      return next(new BadRequestError('Minimum cart value must be a non-negative number.'));
    }
    if (charge === undefined || charge === null || charge < 0) {
      return next(new BadRequestError('Shipping charge must be a non-negative number.'));
    }

    const minVal = Number(minCartValue);
    const chargeVal = Number(charge);
    const maxVal = maxCartValue === null || maxCartValue === '' || maxCartValue === undefined ? null : Number(maxCartValue);

    if (maxVal !== null && maxVal < minVal) {
      return next(new BadRequestError('Maximum cart value cannot be less than minimum cart value.'));
    }

    // Check for range overlaps
    const existingRules = await ShippingRule.find();
    const isOverlapping = existingRules.some(rule => {
      const ruleMin = rule.minCartValue;
      const ruleMax = rule.maxCartValue;

      // Case 1: Both ranges have upper limits
      if (maxVal !== null && ruleMax !== null) {
        return (minVal <= ruleMax && maxVal >= ruleMin);
      }
      // Case 2: New rule has no upper limit, existing has upper limit
      if (maxVal === null && ruleMax !== null) {
        return minVal <= ruleMax;
      }
      // Case 3: New rule has upper limit, existing has no upper limit
      if (maxVal !== null && ruleMax === null) {
        return maxVal >= ruleMin;
      }
      // Case 4: Both ranges have no upper limits
      return true;
    });

    if (isOverlapping) {
      return next(new BadRequestError('This range overlaps with an existing shipping rule.'));
    }

    const rule = await ShippingRule.create({
      minCartValue: minVal,
      maxCartValue: maxVal,
      charge: chargeVal,
    });

    res.status(201).json({
      status: 'success',
      message: 'Shipping rule created successfully.',
      data: { shippingRule: rule },
    });
  } catch (error) {
    next(error);
  }
};

export const updateShippingRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { minCartValue, maxCartValue, charge } = req.body;

    const rule = await ShippingRule.findById(id);
    if (!rule) {
      return next(new NotFoundError('Shipping rule not found.'));
    }

    if (minCartValue === undefined || minCartValue === null || minCartValue < 0) {
      return next(new BadRequestError('Minimum cart value must be a non-negative number.'));
    }
    if (charge === undefined || charge === null || charge < 0) {
      return next(new BadRequestError('Shipping charge must be a non-negative number.'));
    }

    const minVal = Number(minCartValue);
    const chargeVal = Number(charge);
    const maxVal = maxCartValue === null || maxCartValue === '' || maxCartValue === undefined ? null : Number(maxCartValue);

    if (maxVal !== null && maxVal < minVal) {
      return next(new BadRequestError('Maximum cart value cannot be less than minimum cart value.'));
    }

    // Check for range overlaps (excluding current rule)
    const existingRules = await ShippingRule.find({ _id: { $ne: id } });
    const isOverlapping = existingRules.some(r => {
      const ruleMin = r.minCartValue;
      const ruleMax = r.maxCartValue;

      // Case 1: Both ranges have upper limits
      if (maxVal !== null && ruleMax !== null) {
        return (minVal <= ruleMax && maxVal >= ruleMin);
      }
      // Case 2: New rule has no upper limit, existing has upper limit
      if (maxVal === null && ruleMax !== null) {
        return minVal <= ruleMax;
      }
      // Case 3: New rule has upper limit, existing has no upper limit
      if (maxVal !== null && ruleMax === null) {
        return maxVal >= ruleMin;
      }
      // Case 4: Both ranges have no upper limits
      return true;
    });

    if (isOverlapping) {
      return next(new BadRequestError('This range overlaps with an existing shipping rule.'));
    }

    rule.minCartValue = minVal;
    rule.maxCartValue = maxVal;
    rule.charge = chargeVal;
    await rule.save();

    res.status(200).json({
      status: 'success',
      message: 'Shipping rule updated successfully.',
      data: { shippingRule: rule },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteShippingRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await ShippingRule.findById(id);
    if (!rule) {
      return next(new NotFoundError('Shipping rule not found.'));
    }

    await ShippingRule.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Shipping rule deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getCodCharge = async (req, res, next) => {
  try {
    const codSetting = await SystemSetting.findOne({ key: 'cod_charge' });
    const charge = codSetting ? Number(codSetting.value) : 0;
    res.status(200).json({
      status: 'success',
      data: { charge },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCodCharge = async (req, res, next) => {
  try {
    const { charge } = req.body;
    if (charge === undefined || charge === null || Number(charge) < 0) {
      return next(new BadRequestError('COD charge must be a non-negative number.'));
    }

    const codSetting = await SystemSetting.findOneAndUpdate(
      { key: 'cod_charge' },
      { value: Number(charge) },
      { upsert: true, new: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'COD charge updated successfully.',
      data: { charge: Number(codSetting.value) },
    });
  } catch (error) {
    next(error);
  }
};
