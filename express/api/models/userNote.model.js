"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require('mongoose');
const ModelUtils_1 = require("../../api/utils/ModelUtils");
const userNoteSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, default: '' },
    note: String
}, { timestamps: true });
const ALLOWED_FIELDS = ['id', 'user', 'title', 'note', 'createdAt'];
userNoteSchema.method({
    // query is optional, e.g. to transform data for response but only include certain "fields"
    transform({ query = {} } = {}) {
        // transform every record (only respond allowed fields and "&fields=" in query)
        return ModelUtils_1.transformData(this, query, ALLOWED_FIELDS);
    }
});
userNoteSchema.statics = {
    list({ query }) {
        return ModelUtils_1.listData(this, query, ALLOWED_FIELDS);
    }
};
const Model = mongoose.model('UserNote', userNoteSchema);
Model.ALLOWED_FIELDS = ALLOWED_FIELDS;
module.exports = Model;
