import AuditLog from '../models/AuditLog.js';
import logger from '../config/logger.js';

export const logAuditEvent = async ({ actor, action, req, details }) => {
  try {
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown';
    const userAgent = req?.headers?.['user-agent'] || 'unknown';

    const audit = new AuditLog({
      actor,
      action,
      ipAddress,
      userAgent,
      details,
    });
    await audit.save();
  } catch (error) {
    logger.error(`Failed to write audit log: ${error.message}`);
  }
};
