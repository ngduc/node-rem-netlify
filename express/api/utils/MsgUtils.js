"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
// configure for Slack
const { SLACK_WEBHOOK_URL } = require('../../config/vars');
const { IncomingWebhook } = require('@slack/client');
let incomingWebhook = null;
if (SLACK_WEBHOOK_URL) {
    incomingWebhook = new IncomingWebhook(SLACK_WEBHOOK_URL);
}
// configure for emailing
const { EMAIL_MAILGUN_API_KEY, EMAIL_FROM_SUPPORT, EMAIL_MAILGUN_DOMAIN, EMAIL_TEMPLATE_BASE } = require('../../config/vars');
const handlebars = require('handlebars');
// load template file & inject data => return content with injected data.
const template = (fileName, data) => {
    const content = fs.readFileSync(EMAIL_TEMPLATE_BASE + fileName).toString();
    const inject = handlebars.compile(content);
    return inject(data);
};
// --------- Email Templates --------- //
function welcomeEmail({ name, email }) {
    return {
        from: EMAIL_FROM_SUPPORT,
        to: `${name} <${email}>`,
        subject: `Welcome!`,
        text: template('welcome.txt', { name, email }),
        html: template('welcome.html', { name, email })
    };
}
exports.welcomeEmail = welcomeEmail;
function forgotPasswordEmail({ name, email, tempPass }) {
    return {
        from: EMAIL_FROM_SUPPORT,
        to: `${name} <${email}>`,
        subject: `Your one-time temporary password`,
        text: template('forgot-password.txt', { name, email, tempPass }),
        html: template('forgot-password.html', { name, email, tempPass })
    };
}
exports.forgotPasswordEmail = forgotPasswordEmail;
// resetPswEmail, forgotPswEmail, etc.
// --------- Nodemailer and Mailgun setup --------- //
const nodemailer = require('nodemailer');
const mailgunTransport = require('nodemailer-mailgun-transport');
let emailClient = null;
if (EMAIL_MAILGUN_API_KEY) {
    // Configure transport options
    const mailgunOptions = {
        auth: {
            api_key: EMAIL_MAILGUN_API_KEY,
            domain: EMAIL_MAILGUN_DOMAIN // process.env.MAILGUN_DOMAIN,
        }
    };
    const transport = mailgunTransport(mailgunOptions);
    emailClient = nodemailer.createTransport(transport);
}
function sendEmail(data) {
    if (!emailClient) {
        return;
    }
    return new Promise((resolve, reject) => {
        emailClient
            ? emailClient.sendMail(data, (err, info) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(info);
                }
            })
            : '';
    });
}
exports.sendEmail = sendEmail;
// send slack message using incoming webhook url
// @example: slackWebhook('message')
function slackWebhook(message) {
    incomingWebhook ? incomingWebhook.send(message) : '';
}
exports.slackWebhook = slackWebhook;
