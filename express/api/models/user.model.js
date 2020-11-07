"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const jwt = require('jwt-simple');
const uuidv4 = require('uuid/v4');
const APIError = require('../../api/utils/APIError');
const ModelUtils_1 = require("../../api/utils/ModelUtils");
const { env, JWT_SECRET, JWT_EXPIRATION_MINUTES } = require('../../config/vars');
/**
 * User Roles
 */
const roles = ['user', 'admin'];
/**
 * User Schema
 * @private
 */
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        match: /^\S+@\S+\.\S+$/,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: { unique: true }
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 128
    },
    tempPassword: {
        type: String,
        required: false,
        minlength: 6,
        maxlength: 128
    },
    name: {
        type: String,
        maxlength: 128,
        index: true,
        trim: true
    },
    services: {
        facebook: String,
        google: String
    },
    role: {
        type: String,
        enum: roles,
        default: 'user'
    },
    picture: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});
const ALLOWED_FIELDS = ['id', 'name', 'email', 'picture', 'role', 'createdAt'];
/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
userSchema.pre('save', function save(next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // modifying password => encrypt it:
            const rounds = env === 'test' ? 1 : 10;
            if (this.isModified('password')) {
                const hash = yield bcrypt.hash(this.password, rounds);
                this.password = hash;
            }
            else if (this.isModified('tempPassword')) {
                const hash = yield bcrypt.hash(this.tempPassword, rounds);
                this.tempPassword = hash;
            }
            return next(); // normal save
        }
        catch (error) {
            return next(error);
        }
    });
});
/**
 * Methods
 */
userSchema.method({
    // query is optional, e.g. to transform data for response but only include certain "fields"
    transform({ query = {} } = {}) {
        // transform every record (only respond allowed fields and "&fields=" in query)
        return ModelUtils_1.transformData(this, query, ALLOWED_FIELDS);
    },
    token() {
        const playload = {
            exp: moment().add(JWT_EXPIRATION_MINUTES, 'minutes').unix(),
            iat: moment().unix(),
            sub: this._id
        };
        return jwt.encode(playload, JWT_SECRET);
    },
    passwordMatches(password) {
        return __awaiter(this, void 0, void 0, function* () {
            return bcrypt.compare(password, this.password);
        });
    }
});
/**
 * Statics
 */
userSchema.statics = {
    roles,
    /**
     * Get user
     *
     * @param {ObjectId} id - The objectId of user.
     * @returns {Promise<User, APIError>}
     */
    get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let user;
                if (mongoose.Types.ObjectId.isValid(id)) {
                    user = yield this.findById(id).exec();
                }
                if (user) {
                    return user;
                }
                throw new APIError({
                    message: 'User does not exist',
                    status: httpStatus.NOT_FOUND
                });
            }
            catch (error) {
                throw error;
            }
        });
    },
    /**
     * Find user by email and tries to generate a JWT token
     *
     * @param {ObjectId} id - The objectId of user.
     * @returns {Promise<User, APIError>}
     */
    findAndGenerateToken(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password, refreshObject } = options;
            if (!email) {
                throw new APIError({ message: 'An email is required to generate a token' });
            }
            const user = yield this.findOne({ email }).exec();
            const err = {
                status: httpStatus.UNAUTHORIZED,
                isPublic: true
            };
            if (password) {
                if (user && (yield user.passwordMatches(password))) {
                    return { user, accessToken: user.token() };
                }
                err.message = 'Incorrect email or password';
            }
            else if (refreshObject && refreshObject.userEmail === email) {
                if (moment(refreshObject.expires).isBefore()) {
                    err.message = 'Invalid refresh token.';
                }
                else {
                    return { user, accessToken: user.token() };
                }
            }
            else {
                err.message = 'Incorrect email or refreshToken';
            }
            throw new APIError(err);
        });
    },
    /**
     * List users.
     * @returns {Promise<User[]>}
     */
    list({ query }) {
        return ModelUtils_1.listData(this, query, ALLOWED_FIELDS);
    },
    /**
     * Return new validation error
     * if error is a mongoose duplicate key error
     *
     * @param {Error} error
     * @returns {Error|APIError}
     */
    checkDuplicateEmail(error) {
        if (error.name === 'MongoError' && error.code === 11000) {
            return new APIError({
                message: 'Validation Error',
                errors: [
                    {
                        field: 'email',
                        location: 'body',
                        messages: ['"email" already exists']
                    }
                ],
                status: httpStatus.CONFLICT,
                isPublic: true,
                stack: error.stack
            });
        }
        return error;
    },
    oAuthLogin({ service, id, email, name, picture }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.findOne({ $or: [{ [`services.${service}`]: id }, { email }] });
            if (user) {
                user.services[service] = id;
                if (!user.name) {
                    user.name = name;
                }
                if (!user.picture) {
                    user.picture = picture;
                }
                return user.save();
            }
            const password = uuidv4();
            return this.create({
                services: { [service]: id },
                email,
                password,
                name,
                picture
            });
        });
    },
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.find().count();
        });
    }
};
/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);
User.ALLOWED_FIELDS = ALLOWED_FIELDS;
module.exports = User;
