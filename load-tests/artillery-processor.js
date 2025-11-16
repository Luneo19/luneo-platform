/**
 * Artillery processor functions for load testing
 */

module.exports = {
  // Generate random shop domain
  randomShop: function(context, events, done) {
    const shops = [
      'test-shop-1.myshopify.com',
      'test-shop-2.myshopify.com',
      'test-shop-3.myshopify.com',
      'test-shop-4.myshopify.com',
      'test-shop-5.myshopify.com',
    ];
    context.vars.shop = shops[Math.floor(Math.random() * shops.length)];
    context.vars.origin = `https://${context.vars.shop.replace('.myshopify.com', '.com')}`;
    return done();
  },
  
  // Generate random origin
  randomOrigin: function(context, events, done) {
    const shop = context.vars.shop || 'test-shop.myshopify.com';
    context.vars.origin = `https://${shop.replace('.myshopify.com', '.com')}`;
    return done();
  },
};
