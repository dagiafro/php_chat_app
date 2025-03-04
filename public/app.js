
// on page load we check if user is login
const user = getUser();
if (user) {
    $("#logout-btn").text(`<- Logout (${user.name})`);
    // hide auth form if user is authenticated
    $('#auth-container').hide();
    // show chat
    $('#chat-container').show();

    //
    loadResource();

    // Auto-refresh data every second
    setInterval(function () {
        loadResource();
    }, 2000);
}

//! login
function login() {
    let email = $('#email').val();
    let password = $('#password').val();

    authUser(email, password, function (result) {
        if (result === true) {
            $('#auth-container').hide();
            $('#chat-container').show();

            //
            loadResource();
        } else {
            alert(result || "Login Failed");
        }
    });
}


//! register
function register() {
    let name = $('#signup-name').val();
    let email = $('#signup-email').val();
    let password = $('#signup-password').val();

    registerUser(name, email, password, function (result) {
        console.log(result)
        if (result === true) {
            // switch to login form
            toggleAuth("login");
        } else {
            alert(result || "Registration Failed");
        }
    });

}

//! logout
function logout() {
    //remove auth token
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // show login
    $('#auth-container').show();
    $('#chat-container').hide();
}

function loadResource() {
    // load group
    loadGroups();
    // load user
    loadUsers();
    // load msgs
    loadMessages();
}

//! create group
function createGroup() {
    let name = $('#group-name');
    if(!name.val()) {
        return false;
    }
    _createGroup(name.val(), function (result) {
        if (result === true) {
            loadGroups();
            name.val("");
        }
    })
}


//! Load groups
function loadGroups() {
    getGroups(function (data) {
        if (typeof data === "object") {
            data.forEach(group => {
                // Check if the group already exists before appending
                if (group && $(`#group-list p[data-id="${group.id}"]`).length === 0) {
                    $('#group-list').append(
                        `<p data-id="${group.id}" data-chat-type="group" class="chat-item">${group.name}</p>`
                    );
                }
            });

            // Attach event listener after elements are added
            $('.chat-item').off('click').on('click', function () {
                // remove all prev active class 
                $('.chat-item').removeClass('active');
                // add to this only
                $(this).addClass("active");
                selectChat(this);
            });
        }
    });
}

//! Load users
function loadUsers() {
    getUsers(function (data) {
        if (typeof data === "object") {
            const currentUser = getUser();
            data.forEach(user => {
                // Check if the user already exists before appending
                if (user && $(`#user-list p[data-id="${user.id}"]`).length === 0 && currentUser.id != user.id) {
                    $('#user-list').append(
                        `<p data-id="${user.id}" data-chat-type="private" class="chat-item">${user.name}</p>`
                    );
                }
            });

            // Attach event listener after elements are added
            $('.chat-item').off('click').on('click', function () {
                // remove all prev active class 
                $('.chat-item').removeClass('active');
                // add to this only
                $(this).addClass("active");
                selectChat(this);
            });
        }
    });
}

function selectChat(target) {
    const chatType = $(target).data("chat-type");
    const name = $(target).text();

    $("#chat-title").text(name);
    $("#chat-type").show();
    $("#chat-type").text(chatType.toUpperCase() + " CHAT");

    loadMessages();
}

function sendMessage() {
    let message = $('#message');

    let selectedChat = $(".chat-item.active");
    let id = selectedChat.data("id");
    let chatType = selectedChat.data("chat-type");

    let groupId = chatType == "group" ? id : null;
    let userId = chatType == "private" ? id : null;

    _sendMessage({
        message: message.val(),
        group_id: groupId,
        receiver_id: userId,
        callback: function (result) {
            if (result === true) {
                message.val('');
                loadMessages();
            }
        }
    });
}

function loadMessages() {
    let selectedChat = $(".chat-item.active");
    if(selectedChat.length === 0) {
        return false;
    }

    let id = selectedChat.data("id");
    let chatType = selectedChat.data("chat-type");

    getMessages({
        group_id: chatType == "group" ? id : null, user_id: chatType == "private" ? id : null, callback: function (data) {
            let messagesContainer = $('#messages');

            // Remove "No Message Found" before adding new messages
            messagesContainer.html("");

            if (Object.keys(data).length > 0) {
                data.forEach(msg => {
                    if ($(`#messages p[data-id="${msg.id}"]`).length === 0) {
                        if(chatType == "private" && !msg.group_id && (msg.sender_id == user.id || msg.receiver_id == user.id)) {
                            messagesContainer.append(
                                `<p data-id="${msg.id}"><strong>${msg.sender_name}:</strong> ${msg.message}</p>`
                            );
                        }
                        if(chatType == "group" && msg.group_id) {
                            messagesContainer.append(
                                `<p data-id="${msg.id}"><strong>${msg.sender_name}:</strong> ${msg.message}</p>`
                            );
                        }
                        
                    }
                });
                
            } else {
                messagesContainer.append("<p><strong>No Message Found</strong></p>");
            }
        }
    })
}




//! ui methods
// toggle auth from login to signup or vis vers
function toggleAuth(form) {
    if (form === 'signup') {
        $('#signup-form').show();
        $('#login-form').hide();
    } else {
        $('#signup-form').hide();
        $('#login-form').show();
    }
}

function showTab(tab) {
    document.getElementById("groups").style.display = tab === "groups" ? "block" : "none";
    document.getElementById("users").style.display = tab === "users" ? "block" : "none";

    document.querySelectorAll(".tab").forEach(btn => btn.classList.remove("active"));
    document.querySelector(`.tab[onclick="showTab('${tab}')"]`).classList.add("active");
}