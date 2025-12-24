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
exports.IPClaimsService = void 0;
const common_1 = require("@nestjs/common");
const app_error_1 = require("@/common/errors/app-error");
let IPClaimsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var IPClaimsService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
            this.logger = new common_1.Logger(IPClaimsService.name);
        }
        /**
         * Crée une réclamation IP
         */
        async createClaim(claim) {
            // Vérifier que le design existe
            const design = await this.prisma.design.findUnique({
                where: { id: claim.designId },
                select: {
                    id: true,
                    brandId: true,
                    status: true,
                },
            });
            if (!design) {
                throw app_error_1.AppErrorFactory.notFound('Design', claim.designId, { operation: 'createIPClaim' });
            }
            // Créer la réclamation
            const claimRecord = {
                id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...claim,
                status: 'pending',
            };
            // TODO: Sauvegarder dans table IPClaim
            // Pour l'instant, log
            this.logger.log(`IP claim created: ${claimRecord.id} for design ${claim.designId}`);
            // Bloquer le design automatiquement
            await this.blockDesign(claim.designId, claimRecord.id);
            return claimRecord;
        }
        /**
         * Bloque un design
         */
        async blockDesign(designId, claimId) {
            // TODO: Ajouter champ `blocked` ou `status` dans Design
            // Pour l'instant, mettre à jour metadata
            await this.prisma.design.update({
                where: { id: designId },
                data: {
                    metadata: {
                        ...(await this.prisma.design.findUnique({ where: { id: designId } }))?.metadata,
                        blocked: true,
                        blockedReason: `IP claim: ${claimId}`,
                        blockedAt: new Date(),
                    },
                },
            });
            this.logger.log(`Design ${designId} blocked due to IP claim ${claimId}`);
        }
        /**
         * Révision d'une réclamation (admin)
         */
        async reviewClaim(claimId, status, reviewedBy, resolution) {
            // TODO: Récupérer depuis table IPClaim
            const claim = {
                id: claimId,
                status: 'under_review',
            };
            claim.status = status;
            claim.reviewedBy = reviewedBy;
            claim.reviewedAt = new Date();
            claim.resolution = resolution;
            if (status === 'approved') {
                // Le design reste bloqué
                this.logger.log(`IP claim ${claimId} approved, design remains blocked`);
            }
            else {
                // Débloquer le design
                await this.unblockDesign(claim.designId);
            }
            return claim;
        }
        /**
         * Débloque un design
         */
        async unblockDesign(designId) {
            await this.prisma.design.update({
                where: { id: designId },
                data: {
                    metadata: {
                        ...(await this.prisma.design.findUnique({ where: { id: designId } }))?.metadata,
                        blocked: false,
                        blockedReason: null,
                        blockedAt: null,
                    },
                },
            });
            this.logger.log(`Design ${designId} unblocked`);
        }
        /**
         * Liste les réclamations
         */
        async listClaims(status, limit = 50) {
            // TODO: Récupérer depuis table IPClaim
            return [];
        }
    };
    __setFunctionName(_classThis, "IPClaimsService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        IPClaimsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return IPClaimsService = _classThis;
})();
exports.IPClaimsService = IPClaimsService;
