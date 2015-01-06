/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The AGPL v3 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
var express = require('express');
var router = express.Router();
var passport = require('passport');
var middleware = require('../lib/middleware');
var config = require('../config');
var debug = require('debug')('apollo-auth');

router.delete('/session', function (req, res) {
    req.logout();
    res.send({ message: 'Logged out' });
});

// Respoke token brokered authentication
router.get('/tokens', middleware.isAuthorized, function (req, res, next) {
    var authSettings = {
        endpointId: req.user._id,
        roleId: config.respoke.roleId
    };

    req.respoke.auth.endpoint(authSettings, function (err, authData) {
        if (err) {
            debug('auth.endpoint', err);
            err.status = 500;
            return next(err);
        }

        if (!authData || !authData.tokenId) {
            debug('invalid response from Respoke auth.endpoint method', authData);
            return next(new Error("Invalid response from server. Please try again later."));
        }

        res.send({
            token: authData.tokenId,
            appId: req.respoke.appId,
            baseURL: config.respoke.baseURL,
            systemGroupId: config.systemGroupId,
            systemEndpointId: config.systemEndpointId
        });
    });
});

// Local login
router.post('/local', function (req, res, next) {
    if (typeof req.body.email !== 'string') {
        return res.status(400).send({ message: 'Missing email or username.'});
    }
    req.db.Account.findOne()
    .or([{ _id: req.body.email.toLowerCase() }, { email: req.body.email.toLowerCase() }])
    .select('+password')
    .exec(function (err, account) {
        if (err) {
            return next(err);
        }
        if (!account) {
            return res.status(400).send({ message: 'Incorrect username.' });
        }
        if (!account.password) {
            return res.status(401).send({
                message: 'A password has not been set for this account yet.'
            });
        }
        var hashedPassword = req.utils.hash(req.body.password);
        if (hashedPassword !== account.password) {
            return res.status(401).send({ message: 'Incorrect password.' });
        }
        account = account.toObject();
        delete account.password;
        req.login(account, function (err) {
            if (err) {
                return next(err);
            }
            res.send(req.user);
        });
    });
});

// Redirect the user to Google for authentication.  When complete, Google
// will redirect the user back to the application at /auth/google/callback
router.get(
    '/google',
    passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
    })
);
router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/#/welcome?authFailure=Google+auth+failed'
}), function (req, res) {
    res.redirect('/');
});

module.exports = router;
