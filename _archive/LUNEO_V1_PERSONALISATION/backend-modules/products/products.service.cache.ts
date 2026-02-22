/**
 * Cache configuration for Products Service
 * This file demonstrates how to add caching to ProductsService methods
 */


/**
 * Example cache decorators for ProductsService methods
 * 
 * To use, add these decorators to the corresponding methods in products.service.ts:
 */

// Cache product list (5 minutes)
// @Cache({ ttl: 300, tags: ['products', 'products:list'] })
// async findAll(...) { ... }

// Cache single product (10 minutes)
// @Cache({ ttl: 600, tags: ['products', 'product:{id}'] })
// async findOne(id: string) { ... }

// Invalidate cache on create
// @InvalidateCache(['products', 'products:list'])
// async create(...) { ... }

// Invalidate cache on update
// @InvalidateCache(['products', 'product:{id}'])
// async update(id: string, ...) { ... }

// Invalidate cache on delete
// @InvalidateCache(['products', 'products:list', 'product:{id}'])
// async remove(id: string) { ... }
