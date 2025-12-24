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
exports.IntegrationsService = exports.IntegrationType = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
var IntegrationType;
(function (IntegrationType) {
    IntegrationType["SLACK"] = "slack";
    IntegrationType["ZAPIER"] = "zapier";
    IntegrationType["WEBHOOK"] = "webhook";
    IntegrationType["DISCORD"] = "discord";
    IntegrationType["TEAMS"] = "teams";
    IntegrationType["EMAIL"] = "email";
})(IntegrationType || (exports.IntegrationType = IntegrationType = {}));
let IntegrationsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var IntegrationsService = _classThis = class {
        constructor(prisma, cache, slackService, zapierService, webhookService) {
            this.prisma = prisma;
            this.cache = cache;
            this.slackService = slackService;
            this.zapierService = zapierService;
            this.webhookService = webhookService;
            this.logger = new common_2.Logger(IntegrationsService.name);
        }
        /**
         * Get all integrations for a brand
         */
        async getIntegrations(brandId) {
            const cacheKey = `integrations:${brandId}`;
            return this.cache.getOrSet(cacheKey, async () => {
                // In a real implementation, this would query a dedicated Integration table
                // For now, we'll return configured integrations based on brand settings
                const brand = await this.prisma.brand.findUnique({
                    where: { id: brandId },
                    select: {
                        id: true,
                        name: true,
                        settings: true,
                    },
                });
                if (!brand) {
                    throw new common_1.NotFoundException('Brand not found');
                }
                const settings = brand.settings || {};
                const integrations = [];
                // Check for Slack integration
                const slackConfig = settings.slack;
                if (slackConfig && typeof slackConfig === 'object' && !Array.isArray(slackConfig) && slackConfig.enabled) {
                    integrations.push({
                        id: 'slack-1',
                        type: IntegrationType.SLACK,
                        name: 'Slack Notifications',
                        config: slackConfig,
                        isActive: true,
                        brandId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
                // Check for Zapier integration
                const zapierConfig = settings.zapier;
                if (zapierConfig && typeof zapierConfig === 'object' && !Array.isArray(zapierConfig) && zapierConfig.enabled) {
                    integrations.push({
                        id: 'zapier-1',
                        type: IntegrationType.ZAPIER,
                        name: 'Zapier Webhooks',
                        config: zapierConfig,
                        isActive: true,
                        brandId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
                // Check for Webhook integration
                const webhooksConfig = settings.webhooks;
                if (webhooksConfig && typeof webhooksConfig === 'object' && !Array.isArray(webhooksConfig) && webhooksConfig.enabled) {
                    integrations.push({
                        id: 'webhook-1',
                        type: IntegrationType.WEBHOOK,
                        name: 'Custom Webhooks',
                        config: webhooksConfig,
                        isActive: true,
                        brandId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
                return integrations;
            }, 300); // Cache for 5 minutes
        }
        /**
         * Enable integration
         */
        async enableIntegration(brandId, type, config) {
            // Get current brand settings
            const brand = await this.prisma.brand.findUnique({
                where: { id: brandId },
                select: { settings: true },
            });
            const settings = brand?.settings || {};
            // Update settings with new integration
            settings[type] = {
                enabled: true,
                ...config,
                updatedAt: new Date().toISOString(),
            };
            // Update brand
            await this.prisma.brand.update({
                where: { id: brandId },
                data: { settings },
            });
            // Clear cache
            await this.cache.delSimple(`integrations:${brandId}`);
            // Test integration
            await this.testIntegration(brandId, type, config);
            return {
                id: `${type}-1`,
                type,
                name: this.getIntegrationName(type),
                config,
                isActive: true,
                brandId,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }
        /**
         * Disable integration
         */
        async disableIntegration(brandId, type) {
            const brand = await this.prisma.brand.findUnique({
                where: { id: brandId },
                select: { settings: true },
            });
            const settings = brand?.settings || {};
            const integrationConfig = settings[type];
            if (integrationConfig && typeof integrationConfig === 'object' && !Array.isArray(integrationConfig)) {
                integrationConfig.enabled = false;
                integrationConfig.disabledAt = new Date().toISOString();
                settings[type] = integrationConfig;
            }
            await this.prisma.brand.update({
                where: { id: brandId },
                data: { settings },
            });
            await this.cache.delSimple(`integrations:${brandId}`);
        }
        /**
         * Test integration
         */
        async testIntegration(brandId, type, config) {
            try {
                switch (type) {
                    case IntegrationType.SLACK:
                        return await this.slackService.testConnection(config);
                    case IntegrationType.ZAPIER:
                        return await this.zapierService.testWebhook(config);
                    case IntegrationType.WEBHOOK:
                        return await this.webhookService.testEndpoint(config);
                    default:
                        throw new common_1.BadRequestException('Unsupported integration type');
                }
            }
            catch (error) {
                return {
                    success: false,
                    message: error.message || 'Integration test failed',
                };
            }
        }
        /**
         * Send notification through integrations
         */
        async sendNotification(brandId, event, data) {
            const integrations = await this.getIntegrations(brandId);
            const promises = integrations
                .filter(i => i.isActive)
                .map(async (integration) => {
                try {
                    switch (integration.type) {
                        case IntegrationType.SLACK:
                            await this.slackService.sendMessage(integration.config, event, data);
                            break;
                        case IntegrationType.ZAPIER:
                            await this.zapierService.triggerZap(integration.config, event, data);
                            break;
                        case IntegrationType.WEBHOOK:
                            await this.webhookService.sendWebhook(integration.config, event, data);
                            break;
                    }
                }
                catch (error) {
                    this.logger.error(`Failed to send notification via ${integration.type}:`, error);
                }
            });
            await Promise.allSettled(promises);
        }
        /**
         * Get integration statistics
         */
        async getIntegrationStats(brandId) {
            const integrations = await this.getIntegrations(brandId);
            const byType = {};
            integrations.forEach(i => {
                byType[i.type] = (byType[i.type] || 0) + 1;
            });
            return {
                total: integrations.length,
                active: integrations.filter(i => i.isActive).length,
                byType,
            };
        }
        getIntegrationName(type) {
            const names = {
                [IntegrationType.SLACK]: 'Slack Notifications',
                [IntegrationType.ZAPIER]: 'Zapier Webhooks',
                [IntegrationType.WEBHOOK]: 'Custom Webhooks',
                [IntegrationType.DISCORD]: 'Discord Notifications',
                [IntegrationType.TEAMS]: 'Microsoft Teams',
                [IntegrationType.EMAIL]: 'Email Notifications',
            };
            return names[type] || type;
        }
    };
    __setFunctionName(_classThis, "IntegrationsService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        IntegrationsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return IntegrationsService = _classThis;
})();
exports.IntegrationsService = IntegrationsService;
