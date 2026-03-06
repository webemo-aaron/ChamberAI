/**
 * Stripe Product Manager - AI-Directed Product & Price Creation
 *
 * Automatically creates Stripe products and prices when new offerings
 * are created in the system. Integrates with Stripe API for lifecycle
 * management of billing products.
 */

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_none");

/**
 * Create a new Stripe product with automatic price generation
 *
 * @param {Object} productData - Product details
 * @param {string} productData.name - Product name (e.g., "Premium Reports")
 * @param {string} productData.description - Product description
 * @param {number} productData.priceAmount - Monthly price in cents ($9.99 = 999)
 * @param {string} productData.tier - Tier identifier (pro, council, network, custom)
 * @param {string} productData.category - Product category (addon, feature, service)
 * @param {Object} productData.metadata - Additional metadata
 * @returns {Promise<Object>} {productId, priceId, product, price}
 */
export async function createStripeProduct(productData) {
  try {
    const {
      name,
      description,
      priceAmount,
      tier = "custom",
      category = "addon",
      metadata = {}
    } = productData;

    if (!name || !priceAmount) {
      throw new Error("Product name and priceAmount are required");
    }

    // Create Stripe product
    const product = await stripe.products.create({
      name,
      description: description || `${name} - Auto-created product`,
      type: "service",
      metadata: {
        tier,
        category,
        created_via: "ai_product_manager",
        created_at: new Date().toISOString(),
        ...metadata
      }
    });

    // Create monthly recurring price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: priceAmount,
      currency: "usd",
      recurring: {
        interval: "month",
        interval_count: 1
      },
      metadata: {
        tier,
        category,
        created_via: "ai_product_manager"
      }
    });

    return {
      success: true,
      productId: product.id,
      priceId: price.id,
      product,
      price,
      metadata: {
        name,
        tier,
        category,
        monthlyPrice: priceAmount / 100, // Convert cents to dollars
        created: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Create multiple products (batch operation for new product lines)
 *
 * @param {Array} products - Array of product specifications
 * @returns {Promise<Object>} {successful: [...], failed: [...]}
 */
export async function createStripeProducts(products) {
  const results = {
    successful: [],
    failed: [],
    summary: {
      total: products.length,
      created: 0,
      failed: 0
    }
  };

  for (const product of products) {
    const result = await createStripeProduct(product);
    if (result.success) {
      results.successful.push(result);
      results.summary.created++;
    } else {
      results.failed.push({ ...product, error: result.error });
      results.summary.failed++;
    }
  }

  return results;
}

/**
 * Update product description and metadata
 *
 * @param {string} productId - Stripe product ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>}
 */
export async function updateStripeProduct(productId, updates) {
  try {
    const product = await stripe.products.update(productId, {
      name: updates.name,
      description: updates.description,
      metadata: updates.metadata
    });

    return {
      success: true,
      product
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create an additional price for an existing product
 * (e.g., annual billing option)
 *
 * @param {string} productId - Stripe product ID
 * @param {Object} priceData - Price configuration
 * @param {number} priceData.amount - Price in cents
 * @param {string} priceData.interval - "month" or "year"
 * @param {Object} priceData.metadata - Additional metadata
 * @returns {Promise<Object>}
 */
export async function addProductPrice(productId, priceData) {
  try {
    const { amount, interval = "month", metadata = {} } = priceData;

    const price = await stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency: "usd",
      recurring: {
        interval,
        interval_count: 1
      },
      metadata: {
        created_via: "ai_product_manager",
        ...metadata
      }
    });

    return {
      success: true,
      priceId: price.id,
      price
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all products created by AI manager
 *
 * @returns {Promise<Array>} List of products
 */
export async function listAIProducts() {
  try {
    const products = await stripe.products.list({
      limit: 100,
      expand: ["data.default_price"]
    });

    const aiProducts = products.data.filter(
      p => p.metadata?.created_via === "ai_product_manager"
    );

    return {
      success: true,
      products: aiProducts,
      count: aiProducts.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete a Stripe product (archive it)
 *
 * @param {string} productId - Stripe product ID
 * @returns {Promise<Object>}
 */
export async function archiveStripeProduct(productId) {
  try {
    const product = await stripe.products.update(productId, {
      active: false
    });

    return {
      success: true,
      product
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Sync product configuration from database to Stripe
 * Ensures all local products have corresponding Stripe entries
 *
 * @param {Array} localProducts - Products from database
 * @returns {Promise<Object>} Sync results
 */
export async function syncProductsToStripe(localProducts) {
  const results = {
    synced: [],
    created: [],
    errors: []
  };

  for (const product of localProducts) {
    try {
      if (product.stripeProductId) {
        // Product already has Stripe ID, just verify it exists
        await stripe.products.retrieve(product.stripeProductId);
        results.synced.push(product.id);
      } else {
        // Create new Stripe product
        const result = await createStripeProduct({
          name: product.name,
          description: product.description,
          priceAmount: product.monthlyPrice * 100,
          tier: product.tier || "custom",
          category: product.category || "addon",
          metadata: {
            localId: product.id,
            orgId: product.orgId
          }
        });

        if (result.success) {
          results.created.push({
            localId: product.id,
            stripeProductId: result.productId,
            stripePriceId: result.priceId
          });
        } else {
          results.errors.push({
            localId: product.id,
            error: result.error
          });
        }
      }
    } catch (error) {
      results.errors.push({
        localId: product.id,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Get product analytics from Stripe
 *
 * @param {string} productId - Stripe product ID
 * @returns {Promise<Object>} Product analytics
 */
export async function getProductAnalytics(productId) {
  try {
    const product = await stripe.products.retrieve(productId, {
      expand: ["default_price"]
    });

    // Get customer subscription data (limited to basic info)
    const subscriptions = await stripe.subscriptions.list({
      limit: 1,
      expand: ["data.items.data.price"]
    });

    const relevantSubs = subscriptions.data.filter(sub =>
      sub.items.data.some(item => item.price.product === productId)
    );

    return {
      success: true,
      product: {
        id: product.id,
        name: product.name,
        active: product.active,
        created: product.created,
        metadata: product.metadata
      },
      subscriptions: {
        count: relevantSubs.length,
        details: relevantSubs.map(sub => ({
          id: sub.id,
          status: sub.status,
          current_period_end: sub.current_period_end
        }))
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  createStripeProduct,
  createStripeProducts,
  updateStripeProduct,
  addProductPrice,
  listAIProducts,
  archiveStripeProduct,
  syncProductsToStripe,
  getProductAnalytics
};
