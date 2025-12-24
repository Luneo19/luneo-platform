"use strict";
/**
 * ★★★ WEBSOCKET GATEWAY - REAL-TIME ★★★
 * Gateway WebSocket pour la collaboration temps réel
 * - Gestion connexions
 * - Rooms de collaboration
 * - Cursors partagés
 * - Commentaires en direct
 * - Présence utilisateurs
 */
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
exports.RealtimeGateway = void 0;
// Optional: WebSocket support (install with: npm install @nestjs/websockets socket.io)
let WebSocketGateway, WebSocketServer, SubscribeMessage;
let OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket;
let Server, Socket;
try {
    const websockets = require('@nestjs/websockets');
    WebSocketGateway = websockets.WebSocketGateway;
    WebSocketServer = websockets.WebSocketServer;
    SubscribeMessage = websockets.SubscribeMessage;
    OnGatewayConnection = websockets.OnGatewayConnection;
    OnGatewayDisconnect = websockets.OnGatewayDisconnect;
    MessageBody = websockets.MessageBody;
    ConnectedSocket = websockets.ConnectedSocket;
    const socketio = require('socket.io');
    Server = socketio.Server;
    Socket = socketio.Socket;
}
catch (e) {
    // WebSocket packages not installed
}
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('RealtimeGateway');
// ========================================
// GATEWAY
// ========================================
// Only decorate if WebSocket packages are available
let GatewayDecorator = (target) => target;
let ServerDecorator = () => { };
if (WebSocketGateway) {
    GatewayDecorator = WebSocketGateway({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
        namespace: '/realtime',
    });
    if (WebSocketServer) {
        ServerDecorator = WebSocketServer();
    }
}
let RealtimeGateway = (() => {
    let _classDecorators = [GatewayDecorator];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _server_decorators;
    let _server_initializers = [];
    let _server_extraInitializers = [];
    let _handleJoinRoom_decorators;
    let _handleLeaveRoom_decorators;
    let _handleCursorMove_decorators;
    let _handleCommentAdd_decorators;
    let _handleCommentUpdate_decorators;
    let _handleCommentDelete_decorators;
    var RealtimeGateway = _classThis = class {
        constructor(jwtService, prisma) {
            this.jwtService = (__runInitializers(this, _instanceExtraInitializers), jwtService);
            this.prisma = prisma;
            this.server = __runInitializers(this, _server_initializers, void 0);
            this.rooms = (__runInitializers(this, _server_extraInitializers), new Map());
            this.connections = new Map();
            this.handleDisconnect = async (client) => {
                logger.log('Client disconnected', {
                    socketId: client.id,
                    userId: client.userId,
                });
                // Remove from all rooms
                for (const [roomId, room] of this.rooms.entries()) {
                    if (room.participants.has(client.id)) {
                        this.handleLeaveRoom(client, { roomId });
                    }
                }
                this.connections.delete(client.id);
            };
        }
        // ========================================
        // CONNECTION
        // ========================================
        async handleConnection(client) {
            try {
                // Extract token from query or auth header
                const token = client.handshake.query.token ||
                    client.handshake.headers.authorization?.replace('Bearer ', '');
                if (!token) {
                    logger.warn('Connection rejected: No token');
                    client.disconnect();
                    return;
                }
                // Verify token
                const payload = this.jwtService.verify(token);
                client.userId = payload.sub || payload.userId;
                client.brandId = payload.brandId;
                // Get user info
                const user = await this.prisma.user.findUnique({
                    where: { id: client.userId },
                    select: { name: true, email: true, avatar: true },
                });
                client.userName = user?.name || user?.email || 'Unknown';
                this.connections.set(client.id, client);
                // Send connection ID
                client.emit('connection-id', { id: client.id });
                logger.log('Client connected', {
                    socketId: client.id,
                    userId: client.userId,
                    brandId: client.brandId,
                });
            }
            catch (error) {
                logger.error('Connection error', { error });
                client.disconnect();
            }
        }
        // ========================================
        // ROOMS
        // ========================================
        async handleJoinRoom(client, data) {
            const { roomId, type, resourceId } = data;
            // Leave previous rooms
            for (const [id, room] of this.rooms.entries()) {
                if (room.participants.has(client.id) && id !== roomId) {
                    this.handleLeaveRoom(client, { roomId: id });
                }
            }
            // Get or create room
            let room = this.rooms.get(roomId);
            if (!room) {
                room = {
                    id: roomId,
                    type: type,
                    resourceId,
                    participants: new Map(),
                    cursors: new Map(),
                    comments: [],
                };
                this.rooms.set(roomId, room);
            }
            // Add participant
            room.participants.set(client.id, client);
            // Notify client
            client.emit('room-joined', {
                roomId,
                type,
                resourceId,
                participants: Array.from(room.participants.values()).map((p) => ({
                    id: p.userId,
                    name: p.userName,
                    avatar: null,
                })),
                cursors: Array.from(room.cursors.values()),
                comments: room.comments,
            });
            // Notify others
            this.server.to(roomId).emit('user-joined', {
                roomId,
                user: {
                    id: client.userId,
                    name: client.userName,
                    avatar: null,
                },
            });
            // Join socket room
            client.join(roomId);
            logger.log('User joined room', {
                userId: client.userId,
                roomId,
                participants: room.participants.size,
            });
        }
        async handleLeaveRoom(client, data) {
            const { roomId } = data;
            const room = this.rooms.get(roomId);
            if (!room) {
                return;
            }
            // Remove participant
            const clientId = client.id;
            if (clientId) {
                room.participants.delete(clientId);
                room.cursors.delete(clientId);
            }
            // Leave socket room
            client.leave(roomId);
            // Notify others
            this.server.to(roomId).emit('user-left', {
                roomId,
                userId: client.userId,
            });
            // Cleanup empty room
            if (room.participants.size === 0) {
                this.rooms.delete(roomId);
            }
            logger.log('User left room', {
                userId: client.userId,
                roomId,
            });
        }
        // ========================================
        // CURSORS
        // ========================================
        async handleCursorMove(client, data) {
            const { roomId, position } = data;
            const room = this.rooms.get(roomId);
            if (!room || !client.userId) {
                return;
            }
            // Update cursor
            const cursor = {
                id: `cursor-${client.userId}`,
                userId: client.userId,
                userName: client.userName || 'Unknown',
                position,
                color: this.getUserColor(client.userId),
            };
            const clientId = client.id;
            if (clientId) {
                room.cursors.set(clientId, cursor);
            }
            // Broadcast to others in room
            this.server.to(roomId).emit('cursor-moved', {
                roomId,
                cursorId: cursor.id,
                cursor,
            });
        }
        // ========================================
        // COMMENTS
        // ========================================
        async handleCommentAdd(client, data) {
            const { roomId, content, position } = data;
            const room = this.rooms.get(roomId);
            if (!room || !client.userId) {
                return;
            }
            const comment = {
                id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                userId: client.userId,
                userName: client.userName || 'Unknown',
                content,
                position,
                createdAt: new Date(),
            };
            room.comments.push(comment);
            // Broadcast to all in room (including sender)
            this.server.to(roomId).emit('comment-added', {
                roomId,
                comment,
            });
            logger.log('Comment added', {
                userId: client.userId,
                roomId,
                commentId: comment.id,
            });
        }
        async handleCommentUpdate(client, data) {
            const { roomId, commentId, content } = data;
            const room = this.rooms.get(roomId);
            if (!room || !client.userId) {
                return;
            }
            const comment = room.comments.find((c) => c.id === commentId);
            if (!comment || comment.userId !== client.userId) {
                return;
            }
            comment.content = content;
            // Broadcast to all in room
            this.server.to(roomId).emit('comment-updated', {
                roomId,
                commentId,
                comment,
            });
        }
        async handleCommentDelete(client, data) {
            const { roomId, commentId } = data;
            const room = this.rooms.get(roomId);
            if (!room || !client.userId) {
                return;
            }
            const comment = room.comments.find((c) => c.id === commentId);
            if (!comment || comment.userId !== client.userId) {
                return;
            }
            room.comments = room.comments.filter((c) => c.id !== commentId);
            // Broadcast to all in room
            this.server.to(roomId).emit('comment-deleted', {
                roomId,
                commentId,
            });
        }
        // ========================================
        // UTILS
        // ========================================
        /**
         * Génère une couleur pour un utilisateur
         */
        getUserColor(userId) {
            const colors = [
                '#3B82F6',
                '#10B981',
                '#F59E0B',
                '#EF4444',
                '#8B5CF6',
                '#EC4899',
            ];
            const hash = userId.split('').reduce((acc, char) => {
                return char.charCodeAt(0) + ((acc << 5) - acc);
            }, 0);
            return colors[Math.abs(hash) % colors.length];
        }
    };
    __setFunctionName(_classThis, "RealtimeGateway");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _server_decorators = [ServerDecorator];
        _handleJoinRoom_decorators = [(SubscribeMessage ? SubscribeMessage('join-room') : () => { })];
        _handleLeaveRoom_decorators = [(SubscribeMessage ? SubscribeMessage('leave-room') : () => { })];
        _handleCursorMove_decorators = [(SubscribeMessage ? SubscribeMessage('cursor-move') : () => { })];
        _handleCommentAdd_decorators = [(SubscribeMessage ? SubscribeMessage('comment-add') : () => { })];
        _handleCommentUpdate_decorators = [(SubscribeMessage ? SubscribeMessage('comment-update') : () => { })];
        _handleCommentDelete_decorators = [(SubscribeMessage ? SubscribeMessage('comment-delete') : () => { })];
        __esDecorate(_classThis, null, _handleJoinRoom_decorators, { kind: "method", name: "handleJoinRoom", static: false, private: false, access: { has: obj => "handleJoinRoom" in obj, get: obj => obj.handleJoinRoom }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleLeaveRoom_decorators, { kind: "method", name: "handleLeaveRoom", static: false, private: false, access: { has: obj => "handleLeaveRoom" in obj, get: obj => obj.handleLeaveRoom }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleCursorMove_decorators, { kind: "method", name: "handleCursorMove", static: false, private: false, access: { has: obj => "handleCursorMove" in obj, get: obj => obj.handleCursorMove }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleCommentAdd_decorators, { kind: "method", name: "handleCommentAdd", static: false, private: false, access: { has: obj => "handleCommentAdd" in obj, get: obj => obj.handleCommentAdd }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleCommentUpdate_decorators, { kind: "method", name: "handleCommentUpdate", static: false, private: false, access: { has: obj => "handleCommentUpdate" in obj, get: obj => obj.handleCommentUpdate }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleCommentDelete_decorators, { kind: "method", name: "handleCommentDelete", static: false, private: false, access: { has: obj => "handleCommentDelete" in obj, get: obj => obj.handleCommentDelete }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _server_decorators, { kind: "field", name: "server", static: false, private: false, access: { has: obj => "server" in obj, get: obj => obj.server, set: (obj, value) => { obj.server = value; } }, metadata: _metadata }, _server_initializers, _server_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RealtimeGateway = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RealtimeGateway = _classThis;
})();
exports.RealtimeGateway = RealtimeGateway;
