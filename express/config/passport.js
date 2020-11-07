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
const jwtStrategy = require('passport-jwt').Strategy;
const bearerStrategy = require('passport-http-bearer');
const { ExtractJwt } = require('passport-jwt');
const { JWT_SECRET } = require('./vars');
const authProviders = require('../api/services/authProviders');
const models_1 = require("../api/models");
const jwtOptions = {
    secretOrKey: JWT_SECRET,
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer')
};
const jwt = (payload, done) => __awaiter(this, void 0, void 0, function* () {
    try {
        const user = yield models_1.User.findById(payload.sub);
        if (user) {
            return done(null, user);
        }
        return done(null, false);
    }
    catch (error) {
        return done(error, false);
    }
});
const oAuth = (service) => (token, done) => __awaiter(this, void 0, void 0, function* () {
    try {
        const userData = yield authProviders[service](token);
        const user = yield models_1.User.oAuthLogin(userData);
        return done(null, user);
    }
    catch (err) {
        return done(err);
    }
});
exports.jwt = new jwtStrategy(jwtOptions, jwt);
exports.facebook = new bearerStrategy(oAuth('facebook'));
exports.google = new bearerStrategy(oAuth('google'));
