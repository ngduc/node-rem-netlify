"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const Utils_1 = require("../../../api/utils/Utils");
const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const uploadRoutes = require('./upload.route');
const router = express.Router();
/**
 * GET v1/status
 */
router.get('/status', (req, res, next) => {
    Utils_1.apiJson({ req, res, data: { status: 'OK' } });
    return next();
});
/**
 * GET v1/docs
 */
router.use('/docs', express.static('docs'));
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);
module.exports = router;
