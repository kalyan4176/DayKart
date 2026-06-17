import esClient from '../config/elasticsearch.js';
import Product from '../models/Product.js';
import logger from '../config/logger.js';

const INDEX_NAME = 'products';

// Check if Elasticsearch connection is active
const isEsActive = () => {
  return esClient && esClient.ping !== undefined; // ping check helper
};

export const initElasticsearch = async () => {
  try {
    if (!isEsActive()) {
      logger.warn('Elasticsearch is not connected. Fallback to MongoDB search.');
      return;
    }

    const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
    if (!indexExists) {
      await esClient.indices.create({
        index: INDEX_NAME,
        body: {
          settings: {
            analysis: {
              autocomplete_filter: {
                type: 'edge_ngram',
                min_gram: 2,
                max_gram: 20
              }
            },
            analyzer: {
              autocomplete: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'autocomplete_filter']
              }
            }
          },
          mappings: {
            properties: {
              title: {
                type: 'text',
                fields: {
                  suggest: {
                    type: 'text',
                    analyzer: 'autocomplete',
                    search_analyzer: 'standard'
                  }
                }
              },
              description: { type: 'text' },
              tags: { type: 'keyword' },
              price: { type: 'double' },
              category: { type: 'keyword' },
              brand: { type: 'keyword' },
              status: { type: 'keyword' }
            }
          }
        }
      });
      logger.info(`Elasticsearch index '${INDEX_NAME}' created.`);
    }
    
    // Sync all products
    await syncAllProductsToES();
  } catch (error) {
    logger.error(`Elasticsearch initialization failed: ${error.message}`);
  }
};

export const syncAllProductsToES = async () => {
  try {
    if (!isEsActive()) return;

    const products = await Product.find({ status: 'approved' });
    if (products.length === 0) return;

    const body = products.flatMap(doc => [
      { index: { _index: INDEX_NAME, _id: doc._id.toString() } },
      {
        title: doc.title,
        description: doc.description,
        tags: doc.tags,
        price: doc.price,
        category: doc.category.toString(),
        brand: doc.brand.toString(),
        status: doc.status
      }
    ]);

    const bulkResponse = await esClient.bulk({ refresh: true, body });
    if (bulkResponse.errors) {
      logger.warn('Bulk index had some failures.');
    } else {
      logger.info(`Successfully synchronized ${products.length} products to Elasticsearch.`);
    }
  } catch (error) {
    logger.error(`Error syncing products to ES: ${error.message}`);
  }
};

export const indexProduct = async (product) => {
  try {
    if (!isEsActive() || product.status !== 'approved') return;

    await esClient.index({
      index: INDEX_NAME,
      id: product._id.toString(),
      body: {
        title: product.title,
        description: product.description,
        tags: product.tags,
        price: product.price,
        category: product.category.toString(),
        brand: product.brand.toString(),
        status: product.status
      }
    });
    logger.info(`Product indexed in ES: ${product._id}`);
  } catch (error) {
    logger.error(`Failed to index product in ES: ${error.message}`);
  }
};

export const deleteProductFromES = async (productId) => {
  try {
    if (!isEsActive()) return;

    await esClient.delete({
      index: INDEX_NAME,
      id: productId.toString()
    });
    logger.info(`Product deleted from ES: ${productId}`);
  } catch (error) {
    logger.error(`Failed to delete product from ES: ${error.message}`);
  }
};

export const searchProductsES = async (queryText) => {
  try {
    if (!isEsActive()) return null; // trigger MongoDB fallback

    const response = await esClient.search({
      index: INDEX_NAME,
      body: {
        query: {
          bool: {
            must: [
              { term: { status: 'approved' } }
            ],
            should: [
              {
                multi_match: {
                  query: queryText,
                  fields: ['title^3', 'description', 'tags^2'],
                  fuzziness: 'AUTO' // spelling correction
                }
              }
            ],
            minimum_should_match: 1
          }
        }
      }
    });

    return response.hits.hits.map(hit => hit._id);
  } catch (error) {
    logger.error(`Elasticsearch search query failed: ${error.message}`);
    return null; // fallback
  }
};

export const getAutoSuggestionsES = async (prefix) => {
  try {
    if (!isEsActive()) return [];

    const response = await esClient.search({
      index: INDEX_NAME,
      body: {
        query: {
          match: {
            'title.suggest': {
              query: prefix,
              analyzer: 'standard'
            }
          }
        },
        _source: ['title']
      }
    });

    return response.hits.hits.map(hit => hit._source.title);
  } catch (error) {
    logger.error(`Elasticsearch auto suggestions failed: ${error.message}`);
    return [];
  }
};
