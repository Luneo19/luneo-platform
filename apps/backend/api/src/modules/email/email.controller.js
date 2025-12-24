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
exports.EmailController = exports.TestEmailDto = exports.SendEmailDto = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
class SendEmailDto {
}
exports.SendEmailDto = SendEmailDto;
class TestEmailDto {
}
exports.TestEmailDto = TestEmailDto;
let EmailController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Email'), (0, common_1.Controller)('email')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getStatus_decorators;
    let _sendEmail_decorators;
    let _sendWelcomeTest_decorators;
    let _sendPasswordResetTest_decorators;
    let _sendConfirmationTest_decorators;
    let _sendSendGridSimple_decorators;
    let _sendSendGridTemplate_decorators;
    let _sendSendGridScheduled_decorators;
    let _getSendGridStats_decorators;
    let _sendMailgunSimple_decorators;
    let _getMailgunStats_decorators;
    var EmailController = _classThis = class {
        constructor(emailService, mailgunService, sendgridService) {
            this.emailService = (__runInitializers(this, _instanceExtraInitializers), emailService);
            this.mailgunService = mailgunService;
            this.sendgridService = sendgridService;
        }
        getStatus() {
            return {
                providers: this.emailService.getProviderStatus(),
                sendgrid: this.sendgridService.getConfig(),
                mailgun: { available: this.mailgunService.isAvailable() },
                timestamp: new Date().toISOString(),
            };
        }
        async sendEmail(emailData) {
            try {
                const result = await this.emailService.sendEmail(emailData);
                return {
                    success: true,
                    message: 'Email sent successfully',
                    result,
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Failed to send email',
                    error: error.message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async sendWelcomeTest(testData) {
            try {
                const result = await this.emailService.sendWelcomeEmail(testData.email, testData.name || 'Test User', testData.provider);
                return {
                    success: true,
                    message: 'Welcome email sent successfully',
                    result,
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Failed to send welcome email',
                    error: error.message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async sendPasswordResetTest(testData) {
            try {
                const resetToken = 'test-reset-token-' + Date.now();
                const resetUrl = 'https://app.luneo.com/reset-password';
                const result = await this.emailService.sendPasswordResetEmail(testData.email, resetToken, resetUrl, testData.provider);
                return {
                    success: true,
                    message: 'Password reset email sent successfully',
                    result,
                    resetToken,
                    resetUrl,
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Failed to send password reset email',
                    error: error.message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async sendConfirmationTest(testData) {
            try {
                const confirmationToken = 'test-confirmation-token-' + Date.now();
                const confirmationUrl = 'https://app.luneo.com/confirm-email';
                const result = await this.emailService.sendConfirmationEmail(testData.email, confirmationToken, confirmationUrl, testData.provider);
                return {
                    success: true,
                    message: 'Confirmation email sent successfully',
                    result,
                    confirmationToken,
                    confirmationUrl,
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Failed to send confirmation email',
                    error: error.message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        // SendGrid specific endpoints
        async sendSendGridSimple(emailData) {
            try {
                const result = await this.sendgridService.sendSimpleMessage({
                    to: emailData.to,
                    subject: emailData.subject,
                    text: emailData.text,
                    html: emailData.html,
                    from: emailData.from,
                    cc: emailData.cc,
                    bcc: emailData.bcc,
                });
                return {
                    success: true,
                    message: 'SendGrid email sent successfully',
                    result,
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Failed to send SendGrid email',
                    error: error.message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async sendSendGridTemplate(data) {
            try {
                const result = await this.sendgridService.sendTemplateEmail(data.email, data.templateId, data.templateData, data.subject);
                return {
                    success: true,
                    message: 'SendGrid template email sent successfully',
                    result,
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Failed to send SendGrid template email',
                    error: error.message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async sendSendGridScheduled(data) {
            try {
                const sendAt = new Date(data.sendAt);
                const result = await this.sendgridService.sendScheduledEmail(data.email, data.subject, data.html, sendAt);
                return {
                    success: true,
                    message: 'Scheduled email sent successfully',
                    result,
                    sendAt: sendAt.toISOString(),
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Failed to send scheduled email',
                    error: error.message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getSendGridStats() {
            try {
                const stats = await this.sendgridService.getStats();
                return {
                    success: true,
                    stats,
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Failed to get SendGrid stats',
                    error: error.message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        // Mailgun specific endpoints
        async sendMailgunSimple(emailData) {
            try {
                const result = await this.mailgunService.sendSimpleMessage({
                    to: emailData.to,
                    subject: emailData.subject,
                    text: emailData.text,
                    html: emailData.html,
                    from: emailData.from,
                    cc: emailData.cc,
                    bcc: emailData.bcc,
                });
                return {
                    success: true,
                    message: 'Mailgun email sent successfully',
                    result,
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Failed to send Mailgun email',
                    error: error.message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getMailgunStats() {
            try {
                const stats = await this.mailgunService.getStats();
                return {
                    success: true,
                    stats,
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Failed to get Mailgun stats',
                    error: error.message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    __setFunctionName(_classThis, "EmailController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getStatus_decorators = [(0, common_1.Get)('status'), (0, swagger_1.ApiOperation)({ summary: 'Get email providers status' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Email providers status' })];
        _sendEmail_decorators = [(0, common_1.Post)('send'), (0, swagger_1.ApiOperation)({ summary: 'Send email' }), (0, swagger_1.ApiBody)({ type: SendEmailDto }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Email sent successfully' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid email data' }), (0, swagger_1.ApiResponse)({ status: 500, description: 'Email sending failed' })];
        _sendWelcomeTest_decorators = [(0, common_1.Post)('test/welcome'), (0, swagger_1.ApiOperation)({ summary: 'Send welcome test email' }), (0, swagger_1.ApiBody)({ type: TestEmailDto }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Welcome email sent successfully' })];
        _sendPasswordResetTest_decorators = [(0, common_1.Post)('test/password-reset'), (0, swagger_1.ApiOperation)({ summary: 'Send password reset test email' }), (0, swagger_1.ApiBody)({ type: TestEmailDto }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Password reset email sent successfully' })];
        _sendConfirmationTest_decorators = [(0, common_1.Post)('test/confirmation'), (0, swagger_1.ApiOperation)({ summary: 'Send email confirmation test email' }), (0, swagger_1.ApiBody)({ type: TestEmailDto }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Confirmation email sent successfully' })];
        _sendSendGridSimple_decorators = [(0, common_1.Post)('sendgrid/simple'), (0, swagger_1.ApiOperation)({ summary: 'Send simple email via SendGrid (direct)' }), (0, swagger_1.ApiBody)({ type: SendEmailDto }), (0, swagger_1.ApiResponse)({ status: 200, description: 'SendGrid email sent successfully' })];
        _sendSendGridTemplate_decorators = [(0, common_1.Post)('sendgrid/template'), (0, swagger_1.ApiOperation)({ summary: 'Send email with SendGrid template' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'SendGrid template email sent successfully' })];
        _sendSendGridScheduled_decorators = [(0, common_1.Post)('sendgrid/scheduled'), (0, swagger_1.ApiOperation)({ summary: 'Send scheduled email via SendGrid' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Scheduled email sent successfully' })];
        _getSendGridStats_decorators = [(0, common_1.Get)('sendgrid/stats'), (0, swagger_1.ApiOperation)({ summary: 'Get SendGrid statistics' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'SendGrid statistics' })];
        _sendMailgunSimple_decorators = [(0, common_1.Post)('mailgun/simple'), (0, swagger_1.ApiOperation)({ summary: 'Send simple email via Mailgun (direct)' }), (0, swagger_1.ApiBody)({ type: SendEmailDto }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Mailgun email sent successfully' })];
        _getMailgunStats_decorators = [(0, common_1.Get)('mailgun/stats'), (0, swagger_1.ApiOperation)({ summary: 'Get Mailgun statistics' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Mailgun statistics' })];
        __esDecorate(_classThis, null, _getStatus_decorators, { kind: "method", name: "getStatus", static: false, private: false, access: { has: obj => "getStatus" in obj, get: obj => obj.getStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendEmail_decorators, { kind: "method", name: "sendEmail", static: false, private: false, access: { has: obj => "sendEmail" in obj, get: obj => obj.sendEmail }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendWelcomeTest_decorators, { kind: "method", name: "sendWelcomeTest", static: false, private: false, access: { has: obj => "sendWelcomeTest" in obj, get: obj => obj.sendWelcomeTest }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendPasswordResetTest_decorators, { kind: "method", name: "sendPasswordResetTest", static: false, private: false, access: { has: obj => "sendPasswordResetTest" in obj, get: obj => obj.sendPasswordResetTest }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendConfirmationTest_decorators, { kind: "method", name: "sendConfirmationTest", static: false, private: false, access: { has: obj => "sendConfirmationTest" in obj, get: obj => obj.sendConfirmationTest }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendSendGridSimple_decorators, { kind: "method", name: "sendSendGridSimple", static: false, private: false, access: { has: obj => "sendSendGridSimple" in obj, get: obj => obj.sendSendGridSimple }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendSendGridTemplate_decorators, { kind: "method", name: "sendSendGridTemplate", static: false, private: false, access: { has: obj => "sendSendGridTemplate" in obj, get: obj => obj.sendSendGridTemplate }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendSendGridScheduled_decorators, { kind: "method", name: "sendSendGridScheduled", static: false, private: false, access: { has: obj => "sendSendGridScheduled" in obj, get: obj => obj.sendSendGridScheduled }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSendGridStats_decorators, { kind: "method", name: "getSendGridStats", static: false, private: false, access: { has: obj => "getSendGridStats" in obj, get: obj => obj.getSendGridStats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendMailgunSimple_decorators, { kind: "method", name: "sendMailgunSimple", static: false, private: false, access: { has: obj => "sendMailgunSimple" in obj, get: obj => obj.sendMailgunSimple }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMailgunStats_decorators, { kind: "method", name: "getMailgunStats", static: false, private: false, access: { has: obj => "getMailgunStats" in obj, get: obj => obj.getMailgunStats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        EmailController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return EmailController = _classThis;
})();
exports.EmailController = EmailController;
