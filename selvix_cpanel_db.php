<?php
/**
 * ====================================================================
 *              SELVIX GAME ZONE - CPANEL SQL DATABASE BRIDGE
 * ====================================================================
 * 
 * MAELEKEZO YA MATUMIZI (HOW TO USE):
 * ----------------------------------
 * 1. Pakia (Upload) faili hili kwenye cPanel File Manager yako (mfano: public_html/selvix_cpanel_db.php).
 * 2. Badilisha maelezo ya kuunganisha na Database hapa chini (DB_HOST, DB_USER, DB_PASS, DB_NAME).
 * 3. Weka SECRET_KEY yako mwenyewe kwa ajili ya usalama wa mawasiliano ya App na server.
 * 4. Hakikisha umechagua "Tumia cPanel SQL" kwenye Admin Panel ya Selvix Game Zone kisha weka URL ya faili hili.
 * 
 * Mfumo utatengeneza majedwali (Tables) husika moja kwa moja endapo hayatakuwepo!
 */

// --- 1. CONFIGURATION (BADILISHA HAPA) ---
define('DB_HOST', 'localhost');
define('DB_USER', 'YAKO_USER');     // Weka database username ya cPanel hapa
define('DB_PASS', 'YAKO_PASSWORD'); // Weka database password ya cPanel hapa
define('DB_NAME', 'YAKO_DATABASE'); // Weka database name ya cPanel hapa

// Weka neno la siri la kulinda usalama (Secret Key) - lazima ilingane na uliyoweka kwenye Admin Panel
define('SECRET_KEY', 'selvix_secure_key_123'); 

// --- 2. USALAMA NA CORS HEADERS ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Selvix-Key");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Hakiki Secret Key kutoka kwenye Headers
$headers = getallheaders();
$clientKey = isset($headers['X-Selvix-Key']) ? $headers['X-Selvix-Key'] : (isset($_REQUEST['secret_key']) ? $_REQUEST['secret_key'] : '');

if ($clientKey !== SECRET_KEY) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "HAURUHUSIWI! Secret Key haipo sahihi au haijatumwa kwenye Header (X-Selvix-Key)."
    ]);
    exit();
}

// --- 3. KUUNGANISHA DATABASE ---
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "Imeshindwa kuunganisha database ya cPanel: " . $conn->connect_error
    ]);
    exit();
}

// --- 4. KUTENGENEZA MAJEDWALI AUTOMATIC (AUTO-MIGRATE TABLES) ---
$createUsersTable = "CREATE TABLE IF NOT EXISTS selvix_users (
    username VARCHAR(100) PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    phoneNumber VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    isAdmin TINYINT(1) DEFAULT 0,
    isBlockedFromChatting TINYINT(1) DEFAULT 0,
    pointsBalance DECIMAL(15, 2) DEFAULT 100.00,
    streakCount INT DEFAULT 0,
    lastRewardClaimedDate VARCHAR(100) DEFAULT '',
    referredBy VARCHAR(100) DEFAULT '',
    createdDate VARCHAR(100) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

$createTxsTable = "CREATE TABLE IF NOT EXISTS selvix_transactions (
    id VARCHAR(100) PRIMARY KEY,
    reference VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    gameId INT NOT NULL,
    phonenumber VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created VARCHAR(100) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

$conn->query($createUsersTable);
$conn->query($createTxsTable);

// --- 5. SIKILIZA MAOMBI (ENDPOINT ACTIONS) ---
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'ping':
        echo json_encode([
            "success" => true,
            "message" => "Connection ipo vizuri! Mfumo wa cPanel SQL umeanza kufanya kazi kikamilifu."
        ]);
        break;

    case 'get_user':
        $username = isset($_GET['username']) ? $conn->real_escape_string(strtolower(trim($_GET['username']))) : '';
        if (empty($username)) {
            echo json_encode(["success" => false, "message" => "Username inahitajika"]);
            break;
        }
        $res = $conn->query("SELECT * FROM selvix_users WHERE username = '$username'");
        if ($res && $row = $res->fetch_assoc()) {
            $row['isAdmin'] = (bool)$row['isAdmin'];
            $row['isBlockedFromChatting'] = (bool)$row['isBlockedFromChatting'];
            $row['pointsBalance'] = (float)$row['pointsBalance'];
            $row['streakCount'] = (int)$row['streakCount'];
            echo json_encode(["success" => true, "data" => $row]);
        } else {
            echo json_encode(["success" => false, "message" => "Mtumiaji hajapatikana"]);
        }
        break;

    case 'save_user':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['username'])) {
            echo json_encode(["success" => false, "message" => "Data hazijakamilika"]);
            break;
        }
        
        $username = $conn->real_escape_string(strtolower(trim($data['username'])));
        $fullName = $conn->real_escape_string($data['fullName']);
        $phoneNumber = $conn->real_escape_string($data['phoneNumber']);
        $password = $conn->real_escape_string($data['password']);
        $isAdmin = isset($data['isAdmin']) ? ($data['isAdmin'] ? 1 : 0) : 0;
        $isBlockedFromChatting = isset($data['isBlockedFromChatting']) ? ($data['isBlockedFromChatting'] ? 1 : 0) : 0;
        $pointsBalance = isset($data['pointsBalance']) ? (float)$data['pointsBalance'] : 100.00;
        $streakCount = isset($data['streakCount']) ? (int)$data['streakCount'] : 0;
        $lastRewardClaimedDate = $conn->real_escape_string(isset($data['lastRewardClaimedDate']) ? $data['lastRewardClaimedDate'] : '');
        $referredBy = $conn->real_escape_string(isset($data['referredBy']) ? $data['referredBy'] : '');
        $createdDate = $conn->real_escape_string(isset($data['createdDate']) ? $data['createdDate'] : date('Y-m-d H:i:s'));

        // UPSERT kuingiza au kufanya update kama yupo
        $sql = "INSERT INTO selvix_users 
                (username, fullName, phoneNumber, password, isAdmin, isBlockedFromChatting, pointsBalance, streakCount, lastRewardClaimedDate, referredBy, createdDate)
                VALUES 
                ('$username', '$fullName', '$phoneNumber', '$password', $isAdmin, $isBlockedFromChatting, $pointsBalance, $streakCount, '$lastRewardClaimedDate', '$referredBy', '$createdDate')
                ON DUPLICATE KEY UPDATE 
                fullName = '$fullName',
                phoneNumber = '$phoneNumber',
                password = '$password',
                isAdmin = $isAdmin,
                isBlockedFromChatting = $isBlockedFromChatting,
                pointsBalance = $pointsBalance,
                streakCount = $streakCount,
                lastRewardClaimedDate = '$lastRewardClaimedDate',
                referredBy = '$referredBy'";

        if ($conn->query($sql)) {
            echo json_encode(["success" => true, "message" => "Taarifa za mtumiaji zimehifadhiwa/kusawazishwa kwenye cPanel Database."]);
        } else {
            echo json_encode(["success" => false, "message" => "Imeshindwa kuhifadhi: " . $conn->error]);
        }
        break;

    case 'insert_transaction':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['reference'])) {
            echo json_encode(["success" => false, "message" => "Data za muamala hazijakamilika"]);
            break;
        }

        $id = $conn->real_escape_string(isset($data['id']) ? $data['id'] : "TX-" . time() . rand(10, 99));
        $reference = $conn->real_escape_string($data['reference']);
        $username = $conn->real_escape_string(strtolower($data['username']));
        $gameId = (int)$data['gameId'];
        $phonenumber = $conn->real_escape_string($data['phonenumber']);
        $amount = (float)$data['amount'];
        $status = $conn->real_escape_string($data['status']);
        $created = $conn->real_escape_string(isset($data['created']) ? $data['created'] : date('Y-m-d H:i:s'));

        $sql = "INSERT INTO selvix_transactions (id, reference, username, gameId, phonenumber, amount, status, created)
                VALUES ('$id', '$reference', '$username', $gameId, '$phonenumber', $amount, '$status', '$created')
                ON DUPLICATE KEY UPDATE status = '$status'";

        if ($conn->query($sql)) {
            echo json_encode(["success" => true, "message" => "Muamala umehifadhiwa cPanel SQL."]);
        } else {
            echo json_encode(["success" => false, "message" => "Imeshindwa kuhifadhi muamala: " . $conn->error]);
        }
        break;

    case 'get_all_users':
        $res = $conn->query("SELECT * FROM selvix_users");
        $users = [];
        while ($row = $res->fetch_assoc()) {
            $row['isAdmin'] = (bool)$row['isAdmin'];
            $row['isBlockedFromChatting'] = (bool)$row['isBlockedFromChatting'];
            $row['pointsBalance'] = (float)$row['pointsBalance'];
            $row['streakCount'] = (int)$row['streakCount'];
            $users[$row['username']] = $row;
        }
        echo json_encode(["success" => true, "data" => $users]);
        break;

    default:
        echo json_encode([
            "success" => false,
            "message" => "Action haitambuliwi. Jaribu ping, get_user, au save_user."
        ]);
        break;
}

$conn->close();
?>
