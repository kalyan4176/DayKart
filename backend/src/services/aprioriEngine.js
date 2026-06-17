import Order from '../models/Order.js';
import redisClient from '../config/redis.js';
import logger from '../config/logger.js';

export const runAprioriPipeline = async (minSupport = 0.02, minConfidence = 0.2) => {
  try {
    logger.info('Starting Apriori Market Basket Analysis pipeline...');

    // 1. Fetch all items in order transactions
    const orders = await Order.find().select('items.product');
    const transactions = orders.map(order => order.items.map(item => item.product.toString()));
    const totalTransactions = transactions.length;

    if (totalTransactions === 0) {
      logger.info('No transactions found. Skipping Market Basket Analysis.');
      return;
    }

    // 2. Count support for 1-itemsets
    const itemCounts = {};
    transactions.forEach(tx => {
      const uniqueItems = [...new Set(tx)];
      uniqueItems.forEach(item => {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
      });
    });

    // Filter frequent 1-itemsets
    const frequent1Itemsets = [];
    Object.keys(itemCounts).forEach(item => {
      const support = itemCounts[item] / totalTransactions;
      if (support >= minSupport) {
        frequent1Itemsets.push(item);
      }
    });

    // 3. Count support for 2-itemsets
    const pairCounts = {};
    transactions.forEach(tx => {
      const uniqueItems = [...new Set(tx)];
      for (let i = 0; i < uniqueItems.length; i++) {
        for (let j = i + 1; j < uniqueItems.length; j++) {
          const itemA = uniqueItems[i];
          const itemB = uniqueItems[j];
          if (frequent1Itemsets.includes(itemA) && frequent1Itemsets.includes(itemB)) {
            const pairKey = [itemA, itemB].sort().join(',');
            pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1;
          }
        }
      }
    });

    // 4. Generate association rules: antecedent => consequent
    const rules = [];
    Object.keys(pairCounts).forEach(pairKey => {
      const pairCount = pairCounts[pairKey];
      const support = pairCount / totalTransactions;

      if (support >= minSupport) {
        const [itemA, itemB] = pairKey.split(',');

        const countA = itemCounts[itemA];
        const countB = itemCounts[itemB];

        // Rule: A => B
        const confidenceAtoB = pairCount / countA;
        const liftAtoB = confidenceAtoB / (countB / totalTransactions);
        if (confidenceAtoB >= minConfidence && liftAtoB > 1) {
          rules.push({
            antecedent: itemA,
            consequent: itemB,
            support,
            confidence: confidenceAtoB,
            lift: liftAtoB
          });
        }

        // Rule: B => A
        const confidenceBtoA = pairCount / countB;
        const liftBtoA = confidenceBtoA / (countA / totalTransactions);
        if (confidenceBtoA >= minConfidence && liftBtoA > 1) {
          rules.push({
            antecedent: itemB,
            consequent: itemA,
            support,
            confidence: confidenceBtoA,
            lift: liftBtoA
          });
        }
      }
    });

    // 5. Store association rules in Redis
    if (redisClient.isOpen) {
      await redisClient.set('apriori:rules', JSON.stringify(rules));
      logger.info(`Apriori analysis completed. Cached ${rules.length} strong rules in Redis.`);
    }
  } catch (error) {
    logger.error(`Apriori algorithm pipeline failed: ${error.message}`);
  }
};
