exports.generateReference = (prefix = 'TXN') => {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
};
