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
exports.SMTPService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
let SMTPService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SMTPService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(SMTPService.name);
            this.smtpAvailable = false;
            this.initializeSMTP();
        }
        initializeSMTP() {
            const sendgridApiKey = this.configService.get('email.sendgridApiKey');
            const smtpHost = this.configService.get('emailDomain.smtpHost');
            const smtpPort = this.configService.get('emailDomain.smtpPort');
            const smtpSecure = this.configService.get('emailDomain.smtpSecure');
            this.defaultFrom = this.configService.get('emailDomain.smtpFrom');
            this.defaultReplyTo = this.configService.get('emailDomain.sendgridReplyTo');
            if (!sendgridApiKey) {
                this.logger.warn('SendGrid API key not configured. SMTP service will not be available.');
                return;
            }
            try {
                this.transporter = nodemailer.createTransport({
                    host: smtpHost,
                    port: smtpPort,
                    secure: smtpSecure,
                    auth: {
                        user: 'apikey', // Always 'apikey' for SendGrid
                        pass: sendgridApiKey,
                    },
                    // Additional options for better deliverability
                    pool: true,
                    maxConnections: 5,
                    maxMessages: 100,
                    rateLimit: 14, // SendGrid allows 14 emails per second
                    rateDelta: 1000, // Per second
                });
                this.smtpAvailable = true;
                this.logger.log(`SMTP service initialized with ${smtpHost}:${smtpPort}`);
            }
            catch (error) {
                this.logger.error('Failed to initialize SMTP service:', error);
            }
        }
        /**
         * Envoyer un email via SMTP
         */
        async sendEmail(options) {
            if (!this.smtpAvailable) {
                throw new Error('SMTP service not initialized. Check your configuration.');
            }
            try {
                const mailOptions = {
                    from: options.from || this.defaultFrom,
                    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                    subject: options.subject,
                    text: options.text,
                    html: options.html,
                    replyTo: options.replyTo || this.defaultReplyTo,
                };
                if (options.cc) {
                    mailOptions.cc = Array.isArray(options.cc) ? options.cc.join(', ') : options.cc;
                }
                if (options.bcc) {
                    mailOptions.bcc = Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc;
                }
                if (options.attachments) {
                    mailOptions.attachments = options.attachments.map(attachment => ({
                        filename: attachment.filename,
                        content: attachment.content,
                        contentType: attachment.contentType,
                    }));
                }
                if (options.headers) {
                    mailOptions.headers = options.headers;
                }
                if (options.priority) {
                    mailOptions.priority = options.priority;
                }
                const result = await this.transporter.sendMail(mailOptions);
                this.logger.log(`Email sent successfully via SMTP to ${options.to}`);
                return result;
            }
            catch (error) {
                this.logger.error('Failed to send email via SMTP:', error);
                throw error;
            }
        }
        /**
         * Envoyer un email de bienvenue
         */
        async sendWelcomeEmail(userEmail, userName) {
            return this.sendEmail({
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
                priority: 'high',
            });
        }
        /**
         * Envoyer un email de réinitialisation de mot de passe
         */
        async sendPasswordResetEmail(userEmail, resetToken, resetUrl) {
            return this.sendEmail({
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
                priority: 'high',
            });
        }
        /**
         * Envoyer un email de confirmation
         */
        async sendConfirmationEmail(userEmail, confirmationToken, confirmationUrl) {
            return this.sendEmail({
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
                priority: 'high',
            });
        }
        /**
         * Envoyer un email de facture
         */
        async sendInvoiceEmail(userEmail, invoiceData) {
            return this.sendEmail({
                to: userEmail,
                subject: `Facture #${invoiceData.invoiceNumber} - Luneo`,
                html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Facture #${invoiceData.invoiceNumber}</h1>
          <p>Votre facture est prête !</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Détails de la facture :</h3>
            <ul>
              <li><strong>Numéro :</strong> ${invoiceData.invoiceNumber}</li>
              <li><strong>Montant :</strong> ${invoiceData.amount}</li>
              <li><strong>Date d'échéance :</strong> ${invoiceData.dueDate}</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invoiceData.downloadUrl}" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Télécharger la facture
            </a>
          </div>
          <p>Cordialement,<br>L'équipe Luneo</p>
        </div>
      `,
                priority: 'normal',
            });
        }
        /**
         * Envoyer un email de newsletter
         */
        async sendNewsletterEmail(userEmail, newsletterData) {
            return this.sendEmail({
                to: userEmail,
                subject: newsletterData.title,
                html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">${newsletterData.title}</h1>
          <div style="margin: 20px 0;">
            ${newsletterData.content}
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            <a href="${newsletterData.unsubscribeUrl}" style="color: #666;">Se désabonner</a>
          </p>
          <p>Cordialement,<br>L'équipe Luneo</p>
        </div>
      `,
                priority: 'low',
            });
        }
        /**
         * Vérifier la connexion SMTP
         */
        async verifyConnection() {
            if (!this.smtpAvailable) {
                return false;
            }
            try {
                await this.transporter.verify();
                this.logger.log('SMTP connection verified successfully');
                return true;
            }
            catch (error) {
                this.logger.error('SMTP connection verification failed:', error);
                return false;
            }
        }
        /**
         * Vérifier si le service est disponible
         */
        isAvailable() {
            return this.smtpAvailable;
        }
        /**
         * Obtenir la configuration actuelle
         */
        getConfig() {
            return {
                available: this.smtpAvailable,
                defaultFrom: this.defaultFrom,
                defaultReplyTo: this.defaultReplyTo,
            };
        }
    };
    __setFunctionName(_classThis, "SMTPService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SMTPService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SMTPService = _classThis;
})();
exports.SMTPService = SMTPService;
