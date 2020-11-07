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
const models_1 = require("../../api/models");
const DUMMY_USER = {
    email: 'dummy1@example.com',
    role: 'user',
    password: 'dummy111'
};
const ADMIN_USER_1 = {
    email: 'admin1@example.com',
    role: 'admin',
    password: '1admin1'
};
const ADMIN_USER_2 = {
    email: 'admin2@example.com',
    role: 'admin',
    password: '2admin2'
};
function setup() {
    return __awaiter(this, void 0, void 0, function* () {
        const dummyUser = new models_1.User(DUMMY_USER);
        yield dummyUser.save();
        const adminUser1 = new models_1.User(ADMIN_USER_1);
        yield adminUser1.save();
        const createUserNotes = (user, num, text) => __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < num; i += 1) {
                const note = new models_1.UserNote({ user, note: `${text} ${i}` });
                yield note.save();
            }
        });
        yield createUserNotes(adminUser1, 100, 'admin1 note');
        const adminUser2 = new models_1.User(ADMIN_USER_2);
        yield adminUser2.save();
        yield createUserNotes(adminUser2, 50, 'admin2 note');
    });
}
function checkNewDB() {
    return __awaiter(this, void 0, void 0, function* () {
        const dummyUser = yield models_1.User.findOne({ email: DUMMY_USER.email });
        if (!dummyUser) {
            console.log('- New DB detected ===> Initializing Dev Data...');
            yield setup();
        }
        else {
            console.log('- Skip InitData');
        }
    });
}
checkNewDB();
