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
exports.AntiFraudeService = void 0;
const common_1 = require("@nestjs/common");
let AntiFraudeService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AntiFraudeService = _classThis = class {
        constructor(prisma, cache) {
            this.prisma = prisma;
            this.cache = cache;
            this.logger = new common_1.Logger(AntiFraudeService.name);
            // Seuils de risque
            this.THRESHOLDS = {
                velocity: {
                    signupsPerHour: 3,
                    ordersPerHour: 5,
                    paymentsPerHour: 10,
                },
                device: {
                    maxDevicesPerUser: 5,
                },
                email: {
                    suspiciousDomains: ['tempmail.com', '10minutemail.com', 'guerrillamail.com'],
                },
                ip: {
                    maxUsersPerIP: 10,
                },
                value: {
                    suspiciousOrderValue: 10000, // 100€
                },
            };
        }
        /**
         * Vérifie le risque de fraude
         */
        async checkFraud(check) {
            const reasons = [];
            const checks = {
                velocity: false,
                device: false,
                email: false,
                ip: false,
                value: false,
            };
            let riskScore = 0;
            // 1. Vérification velocity
            if (check.userId || check.email) {
                const velocityCheck = await this.checkVelocity(check);
                if (!velocityCheck.passed) {
                    riskScore += 30;
                    reasons.push(velocityCheck.reason);
                    checks.velocity = true;
                }
            }
            // 2. Vérification device
            if (check.deviceFingerprint) {
                const deviceCheck = await this.checkDevice(check);
                if (!deviceCheck.passed) {
                    riskScore += 20;
                    reasons.push(deviceCheck.reason);
                    checks.device = true;
                }
            }
            // 3. Vérification email
            if (check.email) {
                const emailCheck = this.checkEmail(check.email);
                if (!emailCheck.passed) {
                    riskScore += 25;
                    reasons.push(emailCheck.reason);
                    checks.email = true;
                }
            }
            // 4. Vérification IP
            if (check.ipAddress) {
                const ipCheck = await this.checkIP(check.ipAddress);
                if (!ipCheck.passed) {
                    riskScore += 15;
                    reasons.push(ipCheck.reason);
                    checks.ip = true;
                }
            }
            // 5. Vérification valeur commande
            if (check.orderValue) {
                const valueCheck = this.checkOrderValue(check.orderValue);
                if (!valueCheck.passed) {
                    riskScore += 10;
                    reasons.push(valueCheck.reason);
                    checks.value = true;
                }
            }
            // Déterminer le niveau de risque
            let riskLevel = 'low';
            let action = 'allow';
            if (riskScore >= 80) {
                riskLevel = 'critical';
                action = 'block';
            }
            else if (riskScore >= 60) {
                riskLevel = 'high';
                action = 'review';
            }
            else if (riskScore >= 40) {
                riskLevel = 'medium';
                action = 'review';
            }
            return {
                riskScore,
                riskLevel,
                reasons,
                action,
                checks,
            };
        }
        /**
         * Vérifie la velocity (trop d'actions en peu de temps)
         */
        async checkVelocity(check) {
            const key = `fraud:velocity:${check.userId || check.email}:${check.action}`;
            const count = await this.cache.getSimple(key) || 0;
            const threshold = this.THRESHOLDS.velocity[`${check.action}sPerHour`] || 5;
            if (count >= threshold) {
                return {
                    passed: false,
                    reason: `Velocity check failed: ${count} ${check.action}s in the last hour (threshold: ${threshold})`,
                };
            }
            // Incrémenter le compteur
            await this.cache.setSimple(key, count + 1, 3600); // 1 heure
            return { passed: true };
        }
        /**
         * Vérifie le device fingerprint
         */
        async checkDevice(check) {
            if (!check.userId || !check.deviceFingerprint) {
                return { passed: true };
            }
            const key = `fraud:device:${check.userId}`;
            const devices = await this.cache.getSimple(key) || [];
            if (!devices.includes(check.deviceFingerprint)) {
                devices.push(check.deviceFingerprint);
                await this.cache.setSimple(key, devices, 86400 * 30); // 30 jours
            }
            if (devices.length > this.THRESHOLDS.device.maxDevicesPerUser) {
                return {
                    passed: false,
                    reason: `Too many devices: ${devices.length} devices for user (threshold: ${this.THRESHOLDS.device.maxDevicesPerUser})`,
                };
            }
            return { passed: true };
        }
        /**
         * Vérifie l'email
         */
        checkEmail(email) {
            const domain = email.split('@')[1]?.toLowerCase();
            if (this.THRESHOLDS.email.suspiciousDomains.includes(domain)) {
                return {
                    passed: false,
                    reason: `Suspicious email domain: ${domain}`,
                };
            }
            return { passed: true };
        }
        /**
         * Vérifie l'IP
         */
        async checkIP(ipAddress) {
            const key = `fraud:ip:${ipAddress}`;
            const userCount = await this.cache.getSimple(key) || 0;
            if (userCount >= this.THRESHOLDS.ip.maxUsersPerIP) {
                return {
                    passed: false,
                    reason: `Too many users from IP: ${userCount} users (threshold: ${this.THRESHOLDS.ip.maxUsersPerIP})`,
                };
            }
            // Incrémenter (sera mis à jour lors de la création utilisateur)
            await this.cache.setSimple(key, userCount + 1, 86400); // 24 heures
            return { passed: true };
        }
        /**
         * Vérifie la valeur de commande
         */
        checkOrderValue(value) {
            if (value > this.THRESHOLDS.value.suspiciousOrderValue) {
                return {
                    passed: false,
                    reason: `Suspicious order value: ${value} cents (threshold: ${this.THRESHOLDS.value.suspiciousOrderValue})`,
                };
            }
            return { passed: true };
        }
    };
    __setFunctionName(_classThis, "AntiFraudeService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AntiFraudeService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AntiFraudeService = _classThis;
})();
exports.AntiFraudeService = AntiFraudeService;
