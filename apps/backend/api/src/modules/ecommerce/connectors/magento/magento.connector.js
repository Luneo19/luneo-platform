"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MagentoConnector = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let MagentoConnector = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MagentoConnector = _classThis = class {
        constructor(httpService, configService, prisma, cache) {
            this.httpService = httpService;
            this.configService = configService;
            this.prisma = prisma;
            this.cache = cache;
            this.logger = new common_1.Logger(MagentoConnector.name);
        }
        /**
         * Connecte une boutique Magento
         */
        async connect(brandId, storeUrl, apiToken) {
            try {
                // Valider le token
                await this.validateToken(storeUrl, apiToken);
                // Créer l'intégration
                const integration = await this.prisma.ecommerceIntegration.create({
                    data: {
                        brandId,
                        platform: 'magento',
                        shopDomain: storeUrl,
                        accessToken: this.encryptToken(apiToken),
                        config: {
                            apiType: 'graphql',
                            storeCode: 'default',
                        },
                        status: 'active',
                    },
                });
                this.logger.log(`Magento integration created for brand ${brandId}`);
                return integration;
            }
            catch (error) {
                this.logger.error(`Error connecting Magento:`, error);
                throw error;
            }
        }
        /**
         * Valide le token API Magento
         */
        async validateToken(storeUrl, apiToken) {
            try {
                const query = `
        query {
          storeConfig {
            store_code
            store_name
          }
        }
      `;
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${storeUrl}/graphql`, { query }, {
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Content-Type': 'application/json',
                    },
                }));
                return response.data?.data?.storeConfig !== undefined;
            }
            catch (error) {
                this.logger.error(`Invalid Magento token:`, error);
                throw new Error('Invalid Magento API token');
            }
        }
        /**
         * Récupère les produits Magento via GraphQL
         */
        async getProducts(integrationId, options) {
            const integration = await this.getIntegration(integrationId);
            const apiToken = this.decryptToken(integration.accessToken);
            try {
                const query = `
        query getProducts($pageSize: Int, $currentPage: Int) {
          products(
            pageSize: $pageSize
            currentPage: $currentPage
          ) {
            items {
              id
              sku
              name
              price_range {
                minimum_price {
                  regular_price {
                    value
                    currency
                  }
                }
              }
              image {
                url
                label
              }
              media_gallery {
                url
                label
                position
              }
              description {
                html
              }
              short_description {
                html
              }
            }
            total_count
          }
        }
      `;
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${integration.shopDomain}/graphql`, {
                    query,
                    variables: {
                        pageSize: options?.pageSize || 100,
                        currentPage: options?.currentPage || 1,
                    },
                }, {
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Content-Type': 'application/json',
                    },
                }));
                return this.transformMagentoProducts(response.data.data.products.items);
            }
            catch (error) {
                this.logger.error(`Error fetching Magento products:`, error);
                throw error;
            }
        }
        /**
         * Crée ou met à jour un produit Magento via REST
         */
        async upsertProduct(integrationId, productData, sku) {
            const integration = await this.getIntegration(integrationId);
            const apiToken = this.decryptToken(integration.accessToken);
            try {
                const url = sku
                    ? `${integration.shopDomain}/rest/V1/products/${sku}`
                    : `${integration.shopDomain}/rest/V1/products`;
                const method = sku ? 'put' : 'post';
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService[method](url, { product: productData }, {
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Content-Type': 'application/json',
                    },
                }));
                return response.data;
            }
            catch (error) {
                this.logger.error(`Error upserting Magento product:`, error);
                throw error;
            }
        }
        /**
         * Récupère les commandes Magento
         */
        async getOrders(integrationId, options) {
            const integration = await this.getIntegration(integrationId);
            const apiToken = this.decryptToken(integration.accessToken);
            try {
                const searchCriteria = new URLSearchParams();
                searchCriteria.append('searchCriteria[pageSize]', (options?.pageSize || 100).toString());
                searchCriteria.append('searchCriteria[currentPage]', (options?.currentPage || 1).toString());
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${integration.shopDomain}/rest/V1/orders?${searchCriteria}`, {
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                    },
                }));
                return response.data.items;
            }
            catch (error) {
                this.logger.error(`Error fetching Magento orders:`, error);
                throw error;
            }
        }
        /**
         * Transforme les produits Magento GraphQL en format standard
         */
        transformMagentoProducts(graphqlProducts) {
            return graphqlProducts.map(product => ({
                id: product.id,
                sku: product.sku,
                name: product.name,
                status: 1, // Enabled
                visibility: 4, // Catalog, Search
                type_id: 'simple',
                price: product.price_range?.minimum_price?.regular_price?.value || 0,
                attribute_set_id: 4, // Default
                custom_attributes: [],
                media_gallery_entries: product.media_gallery?.map((media, index) => ({
                    id: index + 1,
                    media_type: 'image',
                    label: media.label,
                    position: media.position || index,
                    disabled: false,
                    types: ['image', 'small_image', 'thumbnail'],
                    file: media.url,
                })) || [],
            }));
        }
        /**
         * Synchronise les produits
         */
        async syncProducts(integrationId, options) {
            const startTime = Date.now();
            const errors = [];
            let itemsProcessed = 0;
            let itemsFailed = 0;
            try {
                this.logger.log(`Starting Magento product sync for ${integrationId}`);
                const products = await this.getProducts(integrationId, { pageSize: 100 });
                for (const product of products) {
                    try {
                        await this.handleProductUpdate(integrationId, product);
                        itemsProcessed++;
                    }
                    catch (error) {
                        errors.push({
                            itemId: product.sku,
                            code: 'SYNC_ERROR',
                            message: error.message,
                        });
                        itemsFailed++;
                    }
                }
                const syncLog = await this.prisma.syncLog.create({
                    data: {
                        integrationId,
                        type: 'product',
                        direction: 'import',
                        status: itemsFailed === 0 ? 'success' : 'partial',
                        itemsProcessed,
                        itemsFailed,
                        errors,
                        duration: Date.now() - startTime,
                    },
                });
                return {
                    integrationId,
                    platform: 'magento',
                    type: 'product',
                    direction: 'import',
                    status: syncLog.status,
                    itemsProcessed,
                    itemsFailed,
                    duration: Date.now() - startTime,
                    errors,
                    summary: {
                        created: itemsProcessed - itemsFailed,
                        updated: 0,
                        deleted: 0,
                        skipped: itemsFailed,
                    },
                    createdAt: new Date(),
                };
            }
            catch (error) {
                this.logger.error(`Magento product sync failed:`, error);
                throw error;
            }
        }
        /**
         * Traite une mise à jour de produit
         */
        async handleProductUpdate(integrationId, product) {
            const mapping = await this.prisma.productMapping.findFirst({
                where: {
                    integrationId,
                    externalSku: product.sku,
                },
            });
            if (mapping) {
                await this.updateLuneoProductFromMagento(mapping.luneoProductId, product);
            }
            else {
                await this.createLuneoProductFromMagento(integrationId, product);
            }
        }
        /**
         * Crée un produit LUNEO à partir de Magento
         */
        async createLuneoProductFromMagento(integrationId, magentoProduct) {
            const integration = await this.getIntegration(integrationId);
            const luneoProduct = await this.prisma.product.create({
                data: {
                    brandId: integration.brandId,
                    name: magentoProduct.name,
                    description: '',
                    sku: magentoProduct.sku,
                    price: magentoProduct.price,
                    images: magentoProduct.media_gallery_entries.map(media => media.file),
                    isActive: magentoProduct.status === 1,
                },
            });
            await this.prisma.productMapping.create({
                data: {
                    integrationId,
                    luneoProductId: luneoProduct.id,
                    externalProductId: magentoProduct.id.toString(),
                    externalSku: magentoProduct.sku,
                    syncStatus: 'synced',
                    lastSyncedAt: new Date(),
                },
            });
            this.logger.log(`Created LUNEO product from Magento product ${magentoProduct.sku}`);
        }
        /**
         * Met à jour un produit LUNEO à partir de Magento
         */
        async updateLuneoProductFromMagento(luneoProductId, magentoProduct) {
            await this.prisma.product.update({
                where: { id: luneoProductId },
                data: {
                    name: magentoProduct.name,
                    price: magentoProduct.price,
                    images: magentoProduct.media_gallery_entries.map(media => media.file),
                    isActive: magentoProduct.status === 1,
                },
            });
            this.logger.log(`Updated LUNEO product ${luneoProductId} from Magento`);
        }
        /**
         * Récupère une intégration
         */
        async getIntegration(integrationId) {
            const integration = await this.prisma.ecommerceIntegration.findUnique({
                where: { id: integrationId },
            });
            if (!integration) {
                throw new Error(`Integration ${integrationId} not found`);
            }
            return integration;
        }
        /**
         * Crypte un token
         */
        encryptToken(token) {
            return Buffer.from(token).toString('base64');
        }
        /**
         * Décrypte un token
         */
        decryptToken(encryptedToken) {
            return Buffer.from(encryptedToken, 'base64').toString('utf8');
        }
    };
    __setFunctionName(_classThis, "MagentoConnector");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MagentoConnector = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MagentoConnector = _classThis;
})();
exports.MagentoConnector = MagentoConnector;
