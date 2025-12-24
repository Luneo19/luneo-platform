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
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
let EmailService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var EmailService = _classThis = class {
        constructor(configService, mailgunService, sendgridService) {
            this.configService = configService;
            this.mailgunService = mailgunService;
            this.sendgridService = sendgridService;
            this.logger = new common_1.Logger(EmailService.name);
            this.sendgridAvailable = false;
            this.mailgunAvailable = false;
            this.defaultProvider = 'sendgrid';
            this.initializeProviders();
        }
        initializeProviders() {
            // Vérifier SendGrid
            this.sendgridAvailable = this.sendgridService.isAvailable();
            // Vérifier Mailgun
            this.mailgunAvailable = this.mailgunService.isAvailable();
            // Déterminer le provider par défaut
            if (this.sendgridAvailable) {
                this.defaultProvider = 'sendgrid';
            }
            else if (this.mailgunAvailable) {
                this.defaultProvider = 'mailgun';
            }
            this.logger.log(`Email providers - SendGrid: ${this.sendgridAvailable}, Mailgun: ${this.mailgunAvailable}`);
            this.logger.log(`Default provider: ${this.defaultProvider}`);
        }
        /**
         * Envoyer un email en utilisant le provider approprié
         */
        async sendEmail(options) {
            const provider = options.provider || this.defaultProvider;
            try {
                switch (provider) {
                    case 'sendgrid':
                        return await this.sendWithSendGrid(options);
                    case 'mailgun':
                        return await this.sendWithMailgun(options);
                    case 'auto':
                        return await this.sendWithAutoProvider(options);
                    default:
                        throw new Error(`Unknown email provider: ${provider}`);
                }
            }
            catch (error) {
                this.logger.error(`Failed to send email with ${provider}:`, error);
                // Fallback vers l'autre provider si disponible
                if (provider !== 'auto') {
                    this.logger.log(`Attempting fallback to other provider...`);
                    return await this.sendWithAutoProvider(options);
                }
                throw error;
            }
        }
        /**
         * Envoyer avec SendGrid
         */
        async sendWithSendGrid(options) {
            if (!this.sendgridAvailable) {
                throw new Error('SendGrid not available');
            }
            const sendgridOptions = {
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                from: options.from,
                cc: options.cc,
                bcc: options.bcc,
                attachments: options.attachments,
                templateId: options.template,
                templateData: options.templateData,
                categories: options.tags,
                headers: options.headers,
            };
            return await this.sendgridService.sendSimpleMessage(sendgridOptions);
        }
        /**
         * Envoyer avec Mailgun
         */
        async sendWithMailgun(options) {
            if (!this.mailgunAvailable) {
                throw new Error('Mailgun not available');
            }
            const mailgunOptions = {
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                from: options.from,
                cc: options.cc,
                bcc: options.bcc,
                attachments: options.attachments,
                template: options.template,
                templateData: options.templateData,
                tags: options.tags,
                headers: options.headers,
            };
            return await this.mailgunService.sendSimpleMessage(mailgunOptions);
        }
        /**
         * Envoyer avec le provider automatique (fallback)
         */
        async sendWithAutoProvider(options) {
            // Essayer d'abord le provider par défaut
            try {
                if (this.defaultProvider === 'sendgrid' && this.sendgridAvailable) {
                    return await this.sendWithSendGrid(options);
                }
                else if (this.defaultProvider === 'mailgun' && this.mailgunAvailable) {
                    return await this.sendWithMailgun(options);
                }
            }
            catch (error) {
                this.logger.warn(`Default provider failed, trying alternative...`);
            }
            // Fallback vers l'autre provider
            if (this.defaultProvider === 'sendgrid' && this.mailgunAvailable) {
                return await this.sendWithMailgun(options);
            }
            else if (this.defaultProvider === 'mailgun' && this.sendgridAvailable) {
                return await this.sendWithSendGrid(options);
            }
            throw new Error('No email provider available');
        }
        /**
         * Envoyer un email de bienvenue
         */
        async sendWelcomeEmail(userEmail, userName, provider) {
            const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Bienvenue ${userName} !</h1>
        <p>Nous sommes ravis de vous accueillir chez Luneo.</p>
        <p>Votre compte a été créé avec succès.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Prochaines étapes :</h3>
          <ul>
            <li>Complétez votre profil</li>
            <li>Explorez nos fonctionnalités</li>
            <li>Créez votre premier design</li>
          </ul>
        </div>
        <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
        <p>Cordialement,<br>L'équipe Luneo</p>
      </div>
    `;
            return this.sendEmail({
                to: userEmail,
                subject: 'Bienvenue chez Luneo ! 🎉',
                html,
                tags: ['welcome', 'onboarding'],
                provider,
            });
        }
        /**
         * Envoyer un email de réinitialisation de mot de passe
         */
        async sendPasswordResetEmail(userEmail, resetToken, resetUrl, provider) {
            const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Réinitialisation de mot de passe</h1>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}?token=${resetToken}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p>Ce lien expirera dans 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        <p>Cordialement,<br>L'équipe Luneo</p>
      </div>
    `;
            return this.sendEmail({
                to: userEmail,
                subject: 'Réinitialisation de votre mot de passe',
                html,
                tags: ['password-reset', 'security'],
                provider,
            });
        }
        /**
         * Envoyer un email de confirmation
         */
        async sendConfirmationEmail(userEmail, confirmationToken, confirmationUrl, provider) {
            const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Confirmation d'email</h1>
        <p>Merci de vous être inscrit chez Luneo !</p>
        <p>Pour activer votre compte, veuillez confirmer votre adresse email :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationUrl}?token=${confirmationToken}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Confirmer mon email
          </a>
        </div>
        <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
        <p style="word-break: break-all; color: #666;">${confirmationUrl}?token=${confirmationToken}</p>
        <p>Cordialement,<br>L'équipe Luneo</p>
      </div>
    `;
            return this.sendEmail({
                to: userEmail,
                subject: 'Confirmez votre adresse email',
                html,
                tags: ['email-confirmation', 'onboarding'],
                provider,
            });
        }
        /**
         * Obtenir le statut des providers
         */
        getProviderStatus() {
            return {
                sendgrid: this.sendgridAvailable,
                mailgun: this.mailgunAvailable,
                default: this.defaultProvider,
            };
        }
        /**
         * Obtenir les services individuels
         */
        getSendGridService() {
            return this.sendgridService;
        }
        getMailgunService() {
            return this.mailgunService;
        }
    };
    __setFunctionName(_classThis, "EmailService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        EmailService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return EmailService = _classThis;
})();
exports.EmailService = EmailService;
