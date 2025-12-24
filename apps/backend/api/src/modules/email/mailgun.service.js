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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailgunService = void 0;
const common_1 = require("@nestjs/common");
const mailgun_js_1 = __importDefault(require("mailgun.js"));
const form_data_1 = __importDefault(require("form-data"));
let MailgunService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MailgunService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(MailgunService.name);
            this.initializeMailgun();
        }
        initializeMailgun() {
            const apiKey = this.configService.get('email.mailgunApiKey');
            const domain = this.configService.get('email.mailgunDomain');
            const _url = this.configService.get('email.mailgunUrl');
            this.defaultFrom = this.configService.get('email.fromEmail') || 'noreply@luneo.app';
            if (!apiKey || !domain) {
                this.logger.warn('Mailgun configuration incomplete. Service will not be available.');
                return;
            }
            try {
                this.mailgun = new mailgun_js_1.default(form_data_1.default);
                this.domain = domain;
                this.logger.log(`Mailgun initialized for domain: ${domain}`);
            }
            catch (error) {
                this.logger.error('Failed to initialize Mailgun:', error);
            }
        }
        /**
         * Envoyer un email simple
         */
        async sendSimpleMessage(options) {
            if (!this.mailgun) {
                throw new Error('Mailgun not initialized. Check your configuration.');
            }
            try {
                const mg = this.mailgun.client({
                    username: 'api',
                    key: this.configService.get('email.mailgunApiKey'),
                    url: this.configService.get('email.mailgunUrl'),
                });
                const messageData = {
                    from: options.from || this.defaultFrom,
                    to: Array.isArray(options.to) ? options.to : [options.to],
                    subject: options.subject,
                };
                if (options.text) {
                    messageData.text = options.text;
                }
                if (options.html) {
                    messageData.html = options.html;
                }
                if (options.cc) {
                    messageData.cc = Array.isArray(options.cc) ? options.cc : [options.cc];
                }
                if (options.bcc) {
                    messageData.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
                }
                if (options.tags) {
                    messageData['o:tag'] = options.tags;
                }
                if (options.headers) {
                    Object.entries(options.headers).forEach(([key, value]) => {
                        messageData[`h:${key}`] = value;
                    });
                }
                // Gestion des pièces jointes
                if (options.attachments && options.attachments.length > 0) {
                    options.attachments.forEach((attachment, index) => {
                        messageData[`attachment[${index}]`] = attachment.data;
                        if (attachment.filename) {
                            messageData[`attachment[${index}].filename`] = attachment.filename;
                        }
                        if (attachment.contentType) {
                            messageData[`attachment[${index}].content-type`] = attachment.contentType;
                        }
                    });
                }
                // Gestion des templates
                if (options.template) {
                    messageData.template = options.template;
                    if (options.templateData) {
                        Object.entries(options.templateData).forEach(([key, value]) => {
                            messageData[`v:${key}`] = value;
                        });
                    }
                }
                const result = await mg.messages.create(this.domain, messageData);
                this.logger.log(`Email sent successfully to ${options.to}`);
                return result;
            }
            catch (error) {
                this.logger.error('Failed to send email:', error);
                throw error;
            }
        }
        /**
         * Envoyer un email de bienvenue
         */
        async sendWelcomeEmail(userEmail, userName) {
            return this.sendSimpleMessage({
                to: userEmail,
                subject: 'Bienvenue chez Luneo ! 🎉',
                html: `
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
      `,
                tags: ['welcome', 'onboarding'],
            });
        }
        /**
         * Envoyer un email de réinitialisation de mot de passe
         */
        async sendPasswordResetEmail(userEmail, resetToken, resetUrl) {
            return this.sendSimpleMessage({
                to: userEmail,
                subject: 'Réinitialisation de votre mot de passe',
                html: `
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
      `,
                tags: ['password-reset', 'security'],
            });
        }
        /**
         * Envoyer un email de confirmation
         */
        async sendConfirmationEmail(userEmail, confirmationToken, confirmationUrl) {
            return this.sendSimpleMessage({
                to: userEmail,
                subject: 'Confirmez votre adresse email',
                html: `
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
      `,
                tags: ['email-confirmation', 'onboarding'],
            });
        }
        /**
         * Envoyer un email de notification
         */
        async sendNotificationEmail(userEmail, title, message, actionUrl, actionText) {
            let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">${title}</h1>
        <p>${message}</p>
    `;
            if (actionUrl && actionText) {
                html += `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            ${actionText}
          </a>
        </div>
      `;
            }
            html += `
        <p>Cordialement,<br>L'équipe Luneo</p>
      </div>
    `;
            return this.sendSimpleMessage({
                to: userEmail,
                subject: title,
                html,
                tags: ['notification'],
            });
        }
        /**
         * Vérifier si le service est disponible
         */
        isAvailable() {
            return !!this.mailgun;
        }
        /**
         * Obtenir les statistiques d'envoi
         */
        async getStats() {
            if (!this.mailgun) {
                throw new Error('Mailgun not initialized');
            }
            try {
                const mg = this.mailgun.client({
                    username: 'api',
                    key: this.configService.get('email.mailgunApiKey'),
                    url: this.configService.get('email.mailgunUrl'),
                });
                const stats = await mg.stats.get(this.domain, {});
                return stats;
            }
            catch (error) {
                this.logger.error('Failed to get Mailgun stats:', error);
                throw error;
            }
        }
    };
    __setFunctionName(_classThis, "MailgunService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MailgunService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MailgunService = _classThis;
})();
exports.MailgunService = MailgunService;
