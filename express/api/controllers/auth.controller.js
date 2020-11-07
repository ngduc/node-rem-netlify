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
const httpStatus = require('http-status');
const models_1 = require("../../api/models");
const RefreshToken = require('../models/refreshToken.model');
const moment = require('moment-timezone');
const Utils_1 = require("../../api/utils/Utils");
const MsgUtils_1 = require("../../api/utils/MsgUtils");
const { SEC_ADMIN_EMAIL, JWT_EXPIRATION_MINUTES, slackEnabled, emailEnabled } = require('../../config/vars');
/**
 * Returns a formated object with tokens
 * @private
 */
function generateTokenResponse(user, accessToken) {
    const tokenType = 'Bearer';
    const refreshToken = RefreshToken.generate(user).token;
    const expiresIn = moment().add(JWT_EXPIRATION_MINUTES, 'minutes');
    return {
        tokenType,
        accessToken,
        refreshToken,
        expiresIn
    };
}
/**
 * Returns jwt token if registration was successful
 * @public
 */
exports.register = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const user = yield new models_1.User(req.body).save();
        const userTransformed = user.transform();
        const token = generateTokenResponse(user, user.token());
        res.status(httpStatus.CREATED);
        const data = { token, user: userTransformed };
        if (slackEnabled) {
            MsgUtils_1.slackWebhook(`New User: ${user.email}`); // notify when new user registered
        }
        if (emailEnabled) {
            // for testing: it can only email to "authorized recipients" in Mailgun Account Settings.
            // sendEmail(welcomeEmail({ name: user.name, email: user.email }));
        }
        return Utils_1.apiJson({ req, res, data });
    }
    catch (error) {
        return next(models_1.User.checkDuplicateEmail(error));
    }
});
/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
exports.login = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const { user, accessToken } = yield models_1.User.findAndGenerateToken(req.body);
        const { email } = user;
        const token = generateTokenResponse(user, accessToken);
        if (email === SEC_ADMIN_EMAIL) {
            // setAdminToken(token); // remember admin token for checking later
        }
        else {
            const { ip, headers } = req;
            MsgUtils_1.slackWebhook(`User logged in: ${email} - IP: ${ip} - User Agent: ${headers['user-agent']}`);
        }
        const userTransformed = user.transform();
        const data = { token, user: userTransformed };
        return Utils_1.apiJson({ req, res, data });
    }
    catch (error) {
        return next(error);
    }
});
/**
 * login with an existing user or creates a new one if valid accessToken token
 * Returns jwt token
 * @public
 */
exports.oAuth = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const { user } = req;
        const accessToken = user.token();
        const token = generateTokenResponse(user, accessToken);
        const userTransformed = user.transform();
        return res.json({ token, user: userTransformed });
    }
    catch (error) {
        return next(error);
    }
});
/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
exports.refresh = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const { email, refreshToken } = req.body;
        const refreshObject = yield RefreshToken.findOneAndRemove({
            userEmail: email,
            token: refreshToken
        });
        const { user, accessToken } = yield models_1.User.findAndGenerateToken({ email, refreshObject });
        const response = generateTokenResponse(user, accessToken);
        return res.json(response);
    }
    catch (error) {
        return next(error);
    }
});
/**
 * Send email to a registered user's email with a one-time temporary password
 * @public
 */
exports.forgotPassword = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const { email: reqEmail } = req.body;
        const user = yield models_1.User.findOne({ email: reqEmail });
        if (!user) {
            // RETURN A GENERIC ERROR - DON'T EXPOSE the real reason (user not found) for security.
            return next({ message: 'Invalid request' });
        }
        // user found => generate temp password, then email it to user:
        const { name, email } = user;
        const tempPass = Utils_1.randomString(10, 'abcdefghijklmnopqrstuvwxyz0123456789');
        user.tempPassword = tempPass;
        yield user.save();
        MsgUtils_1.sendEmail(MsgUtils_1.forgotPasswordEmail({ name, email, tempPass }));
        return Utils_1.apiJson({ req, res, data: { status: 'OK' } });
    }
    catch (error) {
        return next(error);
    }
});
