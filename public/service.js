//? check user login and get user detail
function getUser() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"))
    if (!token || !user) {
        return 0;
    }
    return user;
}

//? User Authentication
function authUser(email, password,callback) {
    $.ajax({
        url: "api.php?endpoint=auth",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ email: email, password: password }),
        success: function (response) {
            if (response.status != "ok") {
                return callback(response.message);
            }

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            callback(true);
        },
        error: function (xhr, status, error) {
            callback(error);
        }
    });
}

//? User Registration
function registerUser(name, email, password,callback) {
    $.ajax({
        url: "api.php?endpoint=user",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ name: name, email: email, password: password }),
        success: function (response) {
            if (response.status != "ok") {
                return callback(response.message);
            }
            callback(true);
        },
        error: function (xhr, status, error) {
            callback(error);
        }
    });
}

function onAccessTokenError(message) {
    if (String(message).includes("access_token")) {
        // remove auth tokens
        localStorage.removeItem("user");
        localStorage.removeItem("token");

        // forward to user to login screen
        $('#auth-container').show();
        $('#chat-container').hide();
    }
}

//! protected routes
//? Get All Users
function getUsers(callback) {
    $.ajax({
        url: "api.php?endpoint=users",
        headers: { "x-token": localStorage.getItem("token") },
        type: "GET",
        success: function (response) {
            if (response.status != "ok") {
                onAccessTokenError(response.message);
                return callback(response.message);
            }

            callback(response.data);
        },
        error: function (xhr, status, error) {
            callback(error);
        }
    });
}

//? Create Group
function _createGroup(name,callback) {
    $.ajax({
        url: "api.php?endpoint=group",
        type: "POST",
        contentType: "application/json",
        headers: { "x-token": localStorage.getItem("token") },
        data: JSON.stringify({ name: name }),
        success: function (response) {
            if (response.status != "ok") {
                onAccessTokenError(response.message);
                return callback(response.message);
            }

            callback(true);
        },
        error: function (xhr, status, error) {
            callback(error);
        }
    });
}

//? Get Groups
function getGroups(callback) {
    $.ajax({
        url: "api.php?endpoint=groups",
        type: "GET",
        headers: { "x-token": localStorage.getItem("token") },
        success: function (response) {
            if (response.status != "ok") {
                onAccessTokenError(response.message);
                return callback(response.message);
            }

            callback(response.data);
        },
        error: function (xhr, status, error) {
            callback(error.message);
        }
    });
}


//? get users
function getGetUsers(callback) {
    $.ajax({
        url: "api.php?endpoint=users",
        type: "GET",
        headers: { "x-token": localStorage.getItem("token") },
        success: function (response) {
            if (response.status != "ok") {
                onAccessTokenError(response.message);
                return callback(response.message);
            }

            callback(response.data);
        },
        error: function (xhr, status, error) {
            callback(error.message);
        }
    });
}

//? Send Message
function _sendMessage({message, group_id = null, receiver_id = null,callback}) {
    $.ajax({
        url: "api.php?endpoint=message",
        type: "POST",
        contentType: "application/json",
        headers: { "x-token": localStorage.getItem("token") },
        data: JSON.stringify({ message: message, group_id: group_id, receiver_id: receiver_id }),
        success: function (response) {
            if (response.status != "ok") {
                onAccessTokenError(response.message);
                return callback(response.message);
            }

            callback(true);
        },
        error: function (xhr, status, error) {
            callback(error);
        }
    });
}

//? Get Messages
function getMessages({group_id = null, user_id = null,callback}) {
    let url = "api.php?endpoint=messages";
    if (group_id) url += "&group_id=" + group_id;
    if (user_id) url += "&user_id=" + user_id;

    $.ajax({
        url: url,
        type: "GET",
        headers: { "x-token": localStorage.getItem("token") },
        success: function (response) {
            if (response.status != "ok") {
                onAccessTokenError(response.message);
                return callback(response.message);
            }

            callback(response.data);
        },
        error: function (xhr, status, error) {
            callback(error);
        }
    });
}