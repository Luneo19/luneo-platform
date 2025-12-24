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
exports.I18nService = void 0;
const common_1 = require("@nestjs/common");
let I18nService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var I18nService = _classThis = class {
        constructor(prisma, cache, configService) {
            this.prisma = prisma;
            this.cache = cache;
            this.configService = configService;
            this.logger = new common_1.Logger(I18nService.name);
            this.defaultLocale = 'en';
            this.supportedLocales = ['en', 'fr', 'es', 'de', 'it'];
        }
        /**
         * Get translation for a key in a specific locale
         */
        async translate(key, locale = this.defaultLocale, params) {
            const cacheKey = `translation:${locale}:${key}`;
            // Use cache if available, otherwise direct DB query
            if (this.cache) {
                try {
                    const translation = await this.cache.get(cacheKey, 'translation', async () => {
                        const translation = await this.getTranslationFromDB(key, locale);
                        return translation || key;
                    }, { ttl: 3600, tags: [`locale:${locale}`, `key:${key}`] });
                    const result = translation || key;
                    return this.replaceParams(result, params);
                }
                catch (error) {
                    this.logger.warn(`Cache error for translation ${key}, using fallback`, error);
                    // Fallback to direct DB query
                }
            }
            // Fallback without cache
            const translation = await this.getTranslationFromDB(key, locale);
            const result = translation || key;
            return this.replaceParams(result, params);
        }
        /**
         * Get all translations for a locale
         */
        async getTranslations(locale = this.defaultLocale) {
            const cacheKey = `translations:${locale}`;
            if (this.cache) {
                try {
                    const translations = await this.cache.get(cacheKey, 'translation', async () => {
                        // In a real implementation, this would query all translations for a locale
                        return {};
                    }, { ttl: 3600, tags: [`locale:${locale}`] });
                    return translations || {};
                }
                catch (error) {
                    this.logger.warn(`Cache error for translations ${locale}, using fallback`, error);
                    return {};
                }
            }
            return {};
        }
        /**
         * Get supported locales
         */
        getSupportedLocales() {
            return this.supportedLocales;
        }
        /**
         * Get default locale
         */
        getDefaultLocale() {
            return this.defaultLocale;
        }
        /**
         * Detect locale from Accept-Language header
         */
        detectLocale(acceptLanguage) {
            if (!acceptLanguage) {
                return this.defaultLocale;
            }
            const languages = acceptLanguage
                .split(',')
                .map(lang => {
                const [code, q = '1'] = lang.trim().split(';q=');
                return { code: code.split('-')[0].toLowerCase(), quality: parseFloat(q) };
            })
                .sort((a, b) => b.quality - a.quality);
            for (const lang of languages) {
                if (this.supportedLocales.includes(lang.code)) {
                    return lang.code;
                }
            }
            return this.defaultLocale;
        }
        /**
         * Format date according to locale
         */
        formatDate(date, locale = this.defaultLocale, options) {
            return new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                ...options,
            }).format(date);
        }
        /**
         * Format number according to locale
         */
        formatNumber(value, locale = this.defaultLocale, options) {
            return new Intl.NumberFormat(locale, {
                ...options,
            }).format(value);
        }
        /**
         * Format currency according to locale
         */
        formatCurrency(value, currency, locale = this.defaultLocale) {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency,
            }).format(value);
        }
        /**
         * Private helper to get translation from database
         */
        async getTranslationFromDB(key, locale) {
            // TODO: Implement database query when Translation table is created
            // For now, return null to use fallback
            if (!this.prisma) {
                return null;
            }
            // Future implementation:
            // const translation = await this.prisma.translation.findUnique({
            //   where: { key_locale: { key, locale } },
            // });
            // return translation?.value || null;
            return null;
        }
        /**
         * Private helper to replace parameters in translation
         */
        replaceParams(text, params) {
            if (!params || Object.keys(params).length === 0) {
                return text;
            }
            let result = text;
            for (const [key, value] of Object.entries(params)) {
                const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                result = result.replace(regex, String(value));
            }
            return result;
        }
    };
    __setFunctionName(_classThis, "I18nService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        I18nService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return I18nService = _classThis;
})();
exports.I18nService = I18nService;
