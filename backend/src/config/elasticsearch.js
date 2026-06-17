import { Client } from '@elastic/elasticsearch';
import logger from './logger.js';

const esNode = process.env.ELASTICSEARCH_NODE || 'http://127.0.0.1:9200';
let esClient;

try {
  esClient = new Client({
    node: esNode,
  });
  logger.info(`Elasticsearch Client Initialized on ${esNode}`);
} catch (error) {
  logger.error(`Elasticsearch Connection Error: ${error.message}`);
}

export default esClient;
