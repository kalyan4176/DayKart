export const generateDeterministicOtp = (orderId, type = 'delivery') => {
  let hash = 0;
  const seed = type === 'pickup' ? 'daykart-pickup-salt-2026' : 'daykart-delivery-salt-2026';
  const str = orderId + seed;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const absHash = Math.abs(hash);
  if (type === 'pickup') {
    return (1000 + (absHash % 9000)).toString(); // 4-digit OTP
  } else {
    return (100000 + (absHash % 900000)).toString(); // 6-digit OTP
  }
};
