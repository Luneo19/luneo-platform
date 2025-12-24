"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiGenerationWorker = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const client_1 = require("@prisma/client");
let AiGenerationWorker = (() => {
    let _classDecorators = [(0, common_1.Injectable)(), (0, bull_1.Processor)('ai-generation')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _handleGenerateDesign_decorators;
    let _handleGenerateHighRes_decorators;
    var AiGenerationWorker = _classThis = class {
        constructor(prisma, aiService) {
            this.prisma = (__runInitializers(this, _instanceExtraInitializers), prisma);
            this.aiService = aiService;
            this.logger = new common_1.Logger(AiGenerationWorker.name);
        }
        async handleGenerateDesign(job) {
            const { designId, prompt, options, userId, brandId } = job.data;
            this.logger.log(`Processing design generation for design ${designId}`);
            try {
                // Update design status to processing
                await this.prisma.design.update({
                    where: { id: designId },
                    data: { status: client_1.DesignStatus.PROCESSING },
                });
                // Check user quota (simplified for now)
                const hasQuota = await this.aiService.checkUserQuota(userId, 1);
                if (!hasQuota) {
                    throw new Error('Quota exceeded');
                }
                // Simulate AI generation (replace with actual AI provider call)
                await this.simulateAiGeneration(2000); // 2 seconds
                // Generate mock image URLs
                const previewUrl = `https://cdn.example.com/designs/${designId}/preview.png`;
                const modelUrl = `https://cdn.example.com/designs/${designId}/model.glb`;
                const metadata = {
                    prompt,
                    options,
                    generatedAt: new Date().toISOString(),
                    aiProvider: 'mock',
                    costCents: 50, // Mock cost
                };
                // Update design with results
                await this.prisma.design.update({
                    where: { id: designId },
                    data: {
                        status: client_1.DesignStatus.COMPLETED,
                        previewUrl,
                        metadata,
                    },
                });
                // Record AI cost
                await this.aiService.recordAICost(brandId, 'mock', 'mock-model', 50, { tokens: 100, duration: 2000 });
                this.logger.log(`Design ${designId} generated successfully`);
                return { success: true, designId, previewUrl, modelUrl };
            }
            catch (error) {
                this.logger.error(`Failed to generate design ${designId}:`, error);
                // Update design status to failed
                await this.prisma.design.update({
                    where: { id: designId },
                    data: {
                        status: client_1.DesignStatus.FAILED,
                        metadata: {
                            error: error.message,
                            failedAt: new Date().toISOString(),
                        },
                    },
                });
                throw error;
            }
        }
        async handleGenerateHighRes(job) {
            const { designId, prompt, options, userId } = job.data;
            this.logger.log(`Processing high-res generation for design ${designId}`);
            try {
                // Get current design
                const design = await this.prisma.design.findUnique({
                    where: { id: designId },
                });
                if (!design) {
                    throw new Error(`Design ${designId} not found`);
                }
                // Check user quota for high-res (simplified for now)
                const hasQuota = await this.aiService.checkUserQuota(userId, 1);
                if (!hasQuota) {
                    throw new Error('High-res quota exceeded');
                }
                // Simulate high-res generation
                await this.simulateAiGeneration(5000); // 5 seconds for high-res
                // Generate high-res URLs
                const highResUrl = `https://cdn.example.com/designs/${designId}/high-res.png`;
                const highResModelUrl = `https://cdn.example.com/designs/${designId}/high-res-model.glb`;
                const updatedMetadata = {
                    ...(design.metadata || {}),
                    highResGenerated: true,
                    highResGeneratedAt: new Date().toISOString(),
                    highResCostCents: 200, // Higher cost for high-res
                };
                // Update design with high-res results
                await this.prisma.design.update({
                    where: { id: designId },
                    data: {
                        highResUrl,
                        metadata: updatedMetadata,
                    },
                });
                // Record high-res AI cost
                await this.aiService.recordAICost(design.brandId, 'mock', 'mock-model-highres', 200, { tokens: 200, duration: 5000 });
                this.logger.log(`High-res design ${designId} generated successfully`);
                return { success: true, designId, highResUrl, highResModelUrl };
            }
            catch (error) {
                this.logger.error(`Failed to generate high-res design ${designId}:`, error);
                throw error;
            }
        }
        async simulateAiGeneration(delayMs) {
            return new Promise(resolve => setTimeout(resolve, delayMs));
        }
    };
    __setFunctionName(_classThis, "AiGenerationWorker");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _handleGenerateDesign_decorators = [(0, bull_1.Process)('generate-design')];
        _handleGenerateHighRes_decorators = [(0, bull_1.Process)('generate-high-res')];
        __esDecorate(_classThis, null, _handleGenerateDesign_decorators, { kind: "method", name: "handleGenerateDesign", static: false, private: false, access: { has: obj => "handleGenerateDesign" in obj, get: obj => obj.handleGenerateDesign }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleGenerateHighRes_decorators, { kind: "method", name: "handleGenerateHighRes", static: false, private: false, access: { has: obj => "handleGenerateHighRes" in obj, get: obj => obj.handleGenerateHighRes }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AiGenerationWorker = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AiGenerationWorker = _classThis;
})();
exports.AiGenerationWorker = AiGenerationWorker;
