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
const ObjectId = mongoose.Types.ObjectId;
const httpStatus = require('http-status');
const { omit } = require('lodash');
const models_1 = require("../../api/models");
const Utils_1 = require("../../api/utils/Utils");
const { handler: errorHandler } = require('../middlewares/error');
/**
 * Load user and append to req.
 * @public
 */
exports.load = (req, res, next, id) => __awaiter(this, void 0, void 0, function* () {
    try {
        const user = yield models_1.User.get(id);
        req.route.meta = req.route.meta || {};
        req.route.meta.user = user;
        return next();
    }
    catch (error) {
        return errorHandler(error, req, res);
    }
});
/**
 * Get logged in user info
 * @public
 */
const loggedIn = (req, res) => res.json(req.route.meta.user.transform());
exports.loggedIn = loggedIn;
/**
 * Get user
 * @public
 */
exports.get = loggedIn;
/**
 * Create new user
 * @public
 */
exports.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const user = new models_1.User(req.body);
        const savedUser = yield user.save();
        res.status(httpStatus.CREATED);
        res.json(savedUser.transform());
    }
    catch (error) {
        next(models_1.User.checkDuplicateEmail(error));
    }
});
/**
 * Replace existing user
 * @public
 */
exports.replace = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const { user } = req.route.meta;
        const newUser = new models_1.User(req.body);
        const ommitRole = user.role !== 'admin' ? 'role' : '';
        const newUserObject = omit(newUser.toObject(), '_id', ommitRole);
        yield user.update(newUserObject, { override: true, upsert: true });
        const savedUser = yield models_1.User.findById(user._id);
        res.json(savedUser.transform());
    }
    catch (error) {
        next(models_1.User.checkDuplicateEmail(error));
    }
});
/**
 * Update existing user
 * @public
 */
exports.update = (req, res, next) => {
    const ommitRole = req.route.meta.user.role !== 'admin' ? 'role' : '';
    const updatedUser = omit(req.body, ommitRole);
    const user = Object.assign(req.route.meta.user, updatedUser);
    user
        .save()
        .then((savedUser) => res.json(savedUser.transform()))
        .catch((e) => next(models_1.User.checkDuplicateEmail(e)));
};
/**
 * Get user list
 * @public
 * @example GET https://localhost:3009/v1/users?role=admin&limit=5&offset=0&sort=email:desc,createdAt
 */
exports.list = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        Utils_1.startTimer({ req });
        const data = (yield models_1.User.list(req)).transform(req);
        Utils_1.apiJson({ req, res, data, model: models_1.User });
    }
    catch (e) {
        next(e);
    }
});
/**
 * Get user's notes.
 * NOTE: Any logged in user can get a list of notes of any user.
 * @public
 * @example GET https://localhost:3009/v1/users/USERID/notes
 */
exports.listUserNotes = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        Utils_1.startTimer({ req });
        const userId = req.params.userId;
        req.query = Object.assign({}, req.query, { user: new ObjectId(userId) }); // append to query (by userId) to final query
        const data = (yield models_1.UserNote.list({ query: req.query })).transform(req);
        Utils_1.apiJson({ req, res, data, model: models_1.UserNote });
    }
    catch (e) {
        next(e);
    }
});
/**
 * Add a note.
 * @example POST https://localhost:3009/v1/users/USERID/notes - payload { title, note }
 */
exports.createNote = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const { userId } = req.params;
    const { title, note } = req.body;
    try {
        const newNote = new models_1.UserNote({
            user: new ObjectId(userId),
            title,
            note
        });
        const data = yield newNote.save();
        Utils_1.apiJson({ req, res, data, model: models_1.UserNote });
    }
    catch (e) {
        next(e);
    }
});
/**
 * Delete user note
 * @public
 */
exports.deleteUserNote = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const { userId, noteId } = req.params;
    const { _id } = req.route.meta.user;
    const currentUserId = _id.toString();
    if (userId !== currentUserId) {
        return next(); // only logged in user can delete her own notes
    }
    try {
        yield models_1.UserNote.remove({ user: new ObjectId(userId), _id: new ObjectId(noteId) });
        Utils_1.apiJson({ req, res, data: {} });
    }
    catch (e) {
        next(e);
    }
});
/**
 * Delete user
 * @public
 */
exports.remove = (req, res, next) => {
    const { user } = req.route.meta;
    user
        .remove()
        .then(() => res.status(httpStatus.NO_CONTENT).end())
        .catch((e) => next(e));
};
