"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const router = express.Router();
const { authorize } = require('../../middlewares/auth');
const { UPLOAD_LIMIT } = require('../../../config/vars');
const controller = require('../../controllers/upload.controller');
const multer = require('multer');
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        // fieldname, originalname, mimetype
        cb(null, `${file.fieldname}-${Date.now()}.png`);
    }
});
const upload = multer({ storage, limits: { fieldSize: `${UPLOAD_LIMIT}MB` } });
router.route('/file').post(authorize(), upload.single('file'), controller.upload);
module.exports = router;
