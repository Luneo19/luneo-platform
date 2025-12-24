"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentModerationService = void 0;
const common_1 = require("@nestjs/common");
let ContentModerationService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ContentModerationService = _classThis = class {
        constructor(prisma, configService) {
            this.prisma = prisma;
            this.configService = configService;
            this.logger = new common_1.Logger(ContentModerationService.name);
            this.openaiInstance = null;
        }
        /**
         * Lazy load OpenAI
         */
        async getOpenAI() {
            if (!this.openaiInstance) {
                const openaiModule = await Promise.resolve().then(() => __importStar(require('openai')));
                this.openaiInstance = new openaiModule.default({
                    apiKey: this.configService.get('ai.openaiApiKey'),
                });
            }
            return this.openaiInstance;
        }
        /**
         * Modère du contenu
         */
        async moderate(request) {
            this.logger.log(`Moderating ${request.type} content`);
            try {
                let result;
                switch (request.type) {
                    case 'text':
                        result = await this.moderateText(request.content, request.context);
                        break;
                    case 'image':
                        result = await this.moderateImage(request.content, request.context);
                        break;
                    case 'ai_generation':
                        result = await this.moderateAIGeneration(request.content, request.context);
                        break;
                    default:
                        throw new Error(`Unsupported moderation type: ${request.type}`);
                }
                // Sauvegarder le résultat
                await this.saveModerationResult(request, result);
                return result;
            }
            catch (error) {
                this.logger.error(`Moderation failed:`, error);
                // En cas d'erreur, bloquer par sécurité
                return {
                    approved: false,
                    confidence: 0.5,
                    categories: ['error'],
                    reason: error.message,
                    action: 'block',
                };
            }
        }
        /**
         * Modère du texte
         */
        async moderateText(text, context) {
            const openai = await this.getOpenAI();
            // Modération OpenAI
            const moderation = await openai.moderations.create({
                input: text,
            });
            const result = moderation.results[0];
            const flagged = result.flagged;
            // Vérifier blacklist brand
            if (context?.brandId) {
                const brand = await this.prisma.brand.findUnique({
                    where: { id: context.brandId },
                    select: { settings: true },
                });
                const blacklist = brand?.settings?.blacklist || [];
                const hasBlacklistedWords = blacklist.some((word) => text.toLowerCase().includes(word.toLowerCase()));
                if (hasBlacklistedWords) {
                    return {
                        approved: false,
                        confidence: 1.0,
                        categories: ['blacklist'],
                        reason: 'Contains blacklisted words',
                        action: 'block',
                    };
                }
            }
            // Déterminer l'action
            let action = 'allow';
            if (flagged) {
                const categories = Object.entries(result.categories)
                    .filter(([_, value]) => value)
                    .map(([key]) => key);
                // Catégories critiques = block, autres = review
                const criticalCategories = ['hate', 'harassment', 'self-harm', 'sexual', 'violence'];
                action = categories.some((cat) => criticalCategories.includes(cat)) ? 'block' : 'review';
            }
            return {
                approved: !flagged,
                confidence: result.category_scores ? Math.max(...Object.values(result.category_scores)) : 0.5,
                categories: Object.entries(result.categories)
                    .filter(([_, value]) => value)
                    .map(([key]) => key),
                reason: flagged ? 'Content flagged by moderation API' : undefined,
                action,
            };
        }
        /**
         * Modère une image
         */
        async moderateImage(imageUrl, context) {
            // TODO: Utiliser Vision API pour modération image
            // Pour l'instant, approuver par défaut
            return {
                approved: true,
                confidence: 0.8,
                categories: [],
                action: 'allow',
            };
        }
        /**
         * Modère une génération IA
         */
        async moderateAIGeneration(imageUrl, context) {
            // Modérer l'image générée
            return this.moderateImage(imageUrl, context);
        }
        /**
         * Sauvegarde le résultat de modération
         */
        async saveModerationResult(request, result) {
            // TODO: Créer table ModerationRecord dans Prisma
            // Pour l'instant, log seulement
            if (!result.approved) {
                this.logger.warn(`Content moderation blocked:`, {
                    type: request.type,
                    action: result.action,
                    categories: result.categories,
                    context: request.context,
                });
            }
        }
        /**
         * Récupère l'historique de modération
         */
        async getModerationHistory(userId, brandId, limit = 100) {
            // TODO: Récupérer depuis table ModerationRecord
            return [];
        }
    };
    __setFunctionName(_classThis, "ContentModerationService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ContentModerationService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ContentModerationService = _classThis;
})();
exports.ContentModerationService = ContentModerationService;
