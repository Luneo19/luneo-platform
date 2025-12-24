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
exports.TimezoneService = void 0;
const common_1 = require("@nestjs/common");
let TimezoneService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TimezoneService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(TimezoneService.name);
            this.defaultTimezone = 'UTC';
        }
        /**
         * Get user's timezone from request headers or default
         */
        getUserTimezone(timezoneHeader) {
            if (timezoneHeader && this.isValidTimezone(timezoneHeader)) {
                return timezoneHeader;
            }
            return this.defaultTimezone;
        }
        /**
         * Convert date to user's timezone
         */
        toUserTimezone(date, timezone = this.defaultTimezone) {
            try {
                // Create a date string in the target timezone
                const dateString = date.toLocaleString('en-US', { timeZone: timezone });
                return new Date(dateString);
            }
            catch (error) {
                this.logger.warn(`Invalid timezone ${timezone}, using UTC`);
                return date;
            }
        }
        /**
         * Convert date from user's timezone to UTC
         */
        fromUserTimezone(date, timezone = this.defaultTimezone) {
            try {
                // Get the offset for the timezone
                const offset = this.getTimezoneOffset(timezone);
                const utcTime = date.getTime() - (offset * 60 * 1000);
                return new Date(utcTime);
            }
            catch (error) {
                this.logger.warn(`Invalid timezone ${timezone}, using UTC`);
                return date;
            }
        }
        /**
         * Format date with timezone
         */
        formatDateWithTimezone(date, timezone = this.defaultTimezone, locale = 'en', options) {
            try {
                return new Intl.DateTimeFormat(locale, {
                    timeZone: timezone,
                    ...options,
                }).format(date);
            }
            catch (error) {
                this.logger.warn(`Invalid timezone ${timezone}, using UTC`);
                return new Intl.DateTimeFormat(locale, {
                    timeZone: 'UTC',
                    ...options,
                }).format(date);
            }
        }
        /**
         * Get timezone information
         */
        getTimezoneInfo(timezone = this.defaultTimezone) {
            try {
                const date = new Date();
                const formatter = new Intl.DateTimeFormat('en', {
                    timeZone: timezone,
                    timeZoneName: 'short',
                });
                const parts = formatter.formatToParts(date);
                const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || 'UTC';
                const offset = this.getTimezoneOffset(timezone);
                const offsetString = this.formatOffset(offset);
                return {
                    timezone,
                    offset: offsetString,
                    abbreviation: timeZoneName,
                    name: this.getTimezoneName(timezone),
                };
            }
            catch (error) {
                this.logger.warn(`Invalid timezone ${timezone}, using UTC`);
                return {
                    timezone: 'UTC',
                    offset: '+00:00',
                    abbreviation: 'UTC',
                    name: 'Coordinated Universal Time',
                };
            }
        }
        /**
         * Get common timezones
         */
        getCommonTimezones() {
            return [
                { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
                { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
                { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00' },
                { value: 'America/Denver', label: 'Mountain Time (MT)', offset: '-07:00' },
                { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: '-08:00' },
                { value: 'Europe/London', label: 'London (GMT)', offset: '+00:00' },
                { value: 'Europe/Paris', label: 'Paris (CET)', offset: '+01:00' },
                { value: 'Europe/Berlin', label: 'Berlin (CET)', offset: '+01:00' },
                { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: '+09:00' },
                { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: '+08:00' },
                { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: '+04:00' },
                { value: 'Australia/Sydney', label: 'Sydney (AEDT)', offset: '+11:00' },
            ];
        }
        /**
         * Check if timezone is valid
         */
        isValidTimezone(timezone) {
            try {
                Intl.DateTimeFormat(undefined, { timeZone: timezone });
                return true;
            }
            catch {
                return false;
            }
        }
        /**
         * Get timezone offset in minutes
         */
        getTimezoneOffset(timezone) {
            try {
                const date = new Date();
                const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
                const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
                return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
            }
            catch {
                return 0;
            }
        }
        /**
         * Format offset as string
         */
        formatOffset(offsetMinutes) {
            const hours = Math.floor(Math.abs(offsetMinutes) / 60);
            const minutes = Math.abs(offsetMinutes) % 60;
            const sign = offsetMinutes >= 0 ? '+' : '-';
            return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        /**
         * Get timezone name
         */
        getTimezoneName(timezone) {
            const names = {
                'UTC': 'Coordinated Universal Time',
                'America/New_York': 'Eastern Time',
                'America/Chicago': 'Central Time',
                'America/Denver': 'Mountain Time',
                'America/Los_Angeles': 'Pacific Time',
                'Europe/London': 'Greenwich Mean Time',
                'Europe/Paris': 'Central European Time',
                'Europe/Berlin': 'Central European Time',
                'Asia/Tokyo': 'Japan Standard Time',
                'Asia/Shanghai': 'China Standard Time',
                'Asia/Dubai': 'Gulf Standard Time',
                'Australia/Sydney': 'Australian Eastern Daylight Time',
            };
            return names[timezone] || timezone;
        }
    };
    __setFunctionName(_classThis, "TimezoneService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TimezoneService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TimezoneService = _classThis;
})();
exports.TimezoneService = TimezoneService;
