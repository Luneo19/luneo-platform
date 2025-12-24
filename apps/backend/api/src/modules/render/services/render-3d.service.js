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
exports.Render3DService = void 0;
const common_1 = require("@nestjs/common");
let Render3DService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var Render3DService = _classThis = class {
        constructor(prisma, storageService, cache) {
            this.prisma = prisma;
            this.storageService = storageService;
            this.cache = cache;
            this.logger = new common_1.Logger(Render3DService.name);
        }
        /**
         * Rend un design 3D
         */
        async render3D(request) {
            const startTime = Date.now();
            try {
                this.logger.log(`Starting 3D render for request ${request.id}`);
                // Simulation de rendu 3D
                // En production, utiliser Three.js côté serveur ou Blender headless
                const renderTime = Date.now() - startTime;
                const result = {
                    id: request.id,
                    status: 'success',
                    url: `https://example.com/renders/3d/${request.id}.glb`,
                    thumbnailUrl: `https://example.com/renders/3d/${request.id}_thumb.png`,
                    metadata: {
                        width: request.options.width,
                        height: request.options.height,
                        format: request.options.exportFormat || 'gltf',
                        size: 1024000, // Simulation
                        renderTime,
                        quality: request.options.quality || 'standard',
                    },
                    createdAt: new Date(),
                    completedAt: new Date(),
                };
                this.logger.log(`3D render completed for request ${request.id} in ${renderTime}ms`);
                return result;
            }
            catch (error) {
                this.logger.error(`3D render failed for request ${request.id}:`, error);
                return {
                    id: request.id,
                    status: 'failed',
                    error: error.message,
                    createdAt: new Date(),
                };
            }
        }
    };
    __setFunctionName(_classThis, "Render3DService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Render3DService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Render3DService = _classThis;
})();
exports.Render3DService = Render3DService;
