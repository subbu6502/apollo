exports = module.exports = function (app) {
    var success = function (callback) {
        return function (data) { callback(null, data); };
    };
    var fail = function (callback) {
        return function (err) { callback(err || { error: "Error. No response from the server." }); };
    };
    
    // Account
    app.factory('Account', ['$http', 
        function ($http) {
            return {
                confirm: function (_id, conf, callback) {
                    $http
                    .put('/api/confirmation/' + _id + '/' + conf)
                    .success(success(callback)).error(fail(callback));
                },
                resetPassword: function (_id, conf, password, callback) {
                    $http
                    .put('/api/password-reset/' + _id + '/' + conf, { password: password })
                    .success(success(callback)).error(fail(callback));
                },
                forgotPassword: function (email, callback) {
                    $http
                    .put('/api/forgot/' + email)
                    .success(success(callback)).error(fail(callback));
                },
                create: function (account, callback) {
                    $http
                    .post('/api/accounts', account)
                    .success(success(callback)).error(fail(callback));
                },
                login: function (params, callback) {
                    $http
                    .post('/auth/local', params)
                    .success(success(callback)).error(fail(callback));
                },
                logout: function (callback) {
                    $http({
                        url: '/auth/session',
                        method: 'DELETE'
                    })
                    .success(success(callback)).error(fail(callback));
                },
                get: function (id, callback) {
                    var reqUrl = '/api/accounts';
                    if (id instanceof Function) {
                        callback = id;
                    }
                    else if (id.indexOf('?') === -1) {
                        reqUrl += '/' + id;
                    }
                    else {
                        reqUrl += id;
                    }
                    $http.get(reqUrl)
                    .success(success(callback)).error(fail(callback));
                },
                getMe: function (callback) {
                    $http.get('/api/me')
                    .success(success(callback)).error(fail(callback));
                },
                update: function (params, callback) {
                    $http({
                        url: '/api/me',
                        method: 'PATCH',
                        data: params
                    })
                    .success(success(callback)).error(fail(callback));
                }
            };
        }
    ]);
};
