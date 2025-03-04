<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}
require_once "_utils.php";

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = $_GET['endpoint'] ?? '';
$data = json_decode(file_get_contents("php://input"), true);
$conn = create_db_conn();


//! POST api.php?endpoint=auth
// create auth token
if ($method == "POST" && $endpoint == "auth") {
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    $stmt = $conn->prepare("SELECT id, email, name, password_hash FROM user WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->bind_result($id, $email, $name, $hash);
        $stmt->fetch();

        if (password_verify($password, $hash)) {
            // Generate an encrypted token
            $exp_time = time() + (24 * 60 * 60); // 24 hours expiration
            $token_data = "$id:$exp_time";
            $token = encryptData($token_data);

            // Return token and user info
            response("ok", [
                "token" => $token,
                "user" => [
                    "id" => $id,
                    "email" => $email,
                    "name" => $name
                ]
            ], "Login successful");
        } else {
            response("error", null, "Invalid password");
        }
    } else {
        response("error", null, "User not found");
    }
}


//! POST api.php?endpoint=user
// create user
if ($method == "POST" && $endpoint == "user") {
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $password = password_hash($data['password'], PASSWORD_BCRYPT);

    // Check if the user already exists
    $checkStmt = $conn->prepare("SELECT id FROM user WHERE email = ?");
    $checkStmt->bind_param("s", $email);
    $checkStmt->execute();
    $checkStmt->store_result();
    if ($checkStmt->num_rows > 0) {
        response("error", null, "User already exists");
    }

    $stmt = $conn->prepare("INSERT INTO user (name, email, password_hash) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $name, $email, $password);
    if ($stmt->execute()) {
        response("ok", null, "User registered successfully");
    } else {
        response("error", null, "Registration failed");
    }
}

//! auth user id
$LOGGED_USER_ID = authenticate();


//! GET api.php?endpoint=users
// get users
if ($method == "GET" && $endpoint == "users") {
    $stmt = $conn->prepare("SELECT * FROM `user`");
    $stmt->execute();
    $result = $stmt->get_result();
    $groups = $result->fetch_all(MYSQLI_ASSOC);
    response("ok", $groups);
}


//! POST api.php?endpoint=group
// create group
if ($method == "POST" && $endpoint == "group") {
    $name = $data['name'] ?? '';
    $created_by = $LOGGED_USER_ID;

    $stmt = $conn->prepare("INSERT INTO `group` (name, created_by) VALUES (?, ?)");
    $stmt->bind_param("si", $name, $created_by);
    if ($stmt->execute()) {
        response("ok", null, "Group created successfully");
    } else {
        response("error", null, "Group creation failed");
    }
}


//! GET api.php?endpoint=groups
// get groups
if ($method == "GET" && $endpoint == "groups") {
    $stmt = $conn->prepare("SELECT * FROM `group`");
    $stmt->execute();
    $result = $stmt->get_result();
    $groups = $result->fetch_all(MYSQLI_ASSOC);
    response("ok", $groups);
}


//! POST api.php?endpoint=message
// create messages
if ($method == "POST" && $endpoint == "message") {
    $sender_id = $LOGGED_USER_ID;
    $message = $data['message'] ?? '';
    $group_id = $data['group_id'] ?? null;
    $receiver_id = $data['receiver_id'] ?? null;

    $stmt = $conn->prepare("INSERT INTO chat (sender_id, group_id, receiver_id, message) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("iiis", $sender_id, $group_id, $receiver_id, $message);
    if ($stmt->execute()) {
        response("ok", null, "Message sent");
    } else {
        response("error", null, "Message sending failed");
    }
}

//! GET  api.php?endpoint=messages&group_id=....&user_id=...
// get messages
if ($method == "GET" && $endpoint == "messages") {
    $group_id = $_GET['group_id'] ?? null;
    $user_id = $_GET['user_id'] ?? null;
    
    $sql = "SELECT 
                chat.id, 
                chat.group_id, 
                chat.receiver_id, 
                chat.message, 
                chat.created_at,
                sender.id AS sender_id, 
                sender.name AS sender_name,
                receiver.name AS receiver_name
            FROM chat
            LEFT JOIN user AS sender ON chat.sender_id = sender.id
            LEFT JOIN user AS receiver ON chat.receiver_id = receiver.id
            WHERE 1=1";
    
    $params = [];
    $types = '';

    if ($group_id) {
        $sql .= " AND chat.group_id = ?";
        $params[] = $group_id;
        $types .= 'i';
    }

    if ($user_id) {
        $sql .= " AND (chat.sender_id = ? OR chat.receiver_id = ?)";
        $params[] = $user_id;
        $params[] = $user_id;
        $types .= 'ii';
    }

    $stmt = $conn->prepare($sql);
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $messages = $result->fetch_all(MYSQLI_ASSOC);

    response("ok", $messages, "Messages retrieved successfully");
}

response("error", null, "Invalid endpoint");