<?php
// import configs
require_once "_config.php";


// create db connection
function create_db_conn() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        response("error", null, "Database connection failed");
    }
    return $conn;
}

// base method for api response
function response($status, $data = null, $message = '') {
    echo json_encode(["status" => $status, "data" => $data, "message" => $message]);
    exit;
}


// use to encrypt any data e.g: auth token
function encryptData($data) {
    $cipher = "AES-256-CBC";
    $key = hash('sha256', SECRET_KEY, true); // Secure key
    $iv = openssl_random_pseudo_bytes(16); // Random IV for security

    $encrypted = openssl_encrypt($data, $cipher, $key, 0, $iv);
    return base64_encode($iv . $encrypted); // Store IV + ciphertext
}

// decrypt
function decryptData($encryptedData) {
    $cipher = "AES-256-CBC";
    $key = hash('sha256', SECRET_KEY, true);

    $data = base64_decode($encryptedData);
    $iv = substr($data, 0, 16); // Extract IV
    $encryptedText = substr($data, 16); // Extract encrypted data

    return openssl_decrypt($encryptedText, $cipher, $key, 0, $iv);
}

// returns users id
function authenticate() {
    $token = $_SERVER['HTTP_X_TOKEN'] ?? '';
    
    if (!$token) {
        response("error", null, "access_token required");
    }

    // Decrypt the token
    $decrypted = decryptData($token);
    if (!$decrypted) {
        response("error", null, "invalid access_token");
    }

    list($user_id, $exp_time) = explode(":", $decrypted);
    if (time() > $exp_time) {
        response("error", null, "access_token expired");
    }

    return $user_id;
}
