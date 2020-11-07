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
const axios = require('axios');
exports.facebook = (access_token) => __awaiter(this, void 0, void 0, function* () {
    const fields = 'id, name, email, picture';
    const url = 'https://graph.facebook.com/me';
    const params = { access_token, fields };
    const response = yield axios.get(url, { params });
    const { id, name, email, picture } = response.data;
    return {
        service: 'facebook',
        picture: picture.data.url,
        id,
        name,
        email
    };
});
exports.google = (access_token) => __awaiter(this, void 0, void 0, function* () {
    const url = 'https://www.googleapis.com/oauth2/v3/userinfo';
    const params = { access_token };
    const response = yield axios.get(url, { params });
    const { sub, name, email, picture } = response.data;
    return {
        service: 'google',
        picture,
        id: sub,
        name,
        email
    };
});
