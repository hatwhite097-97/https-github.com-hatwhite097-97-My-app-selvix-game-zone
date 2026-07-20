<?php
/**
 * ====================================================================
 *              SELVIX GAME ZONE - CPANEL SQL TO SUPABASE BRIDGE
 * ====================================================================
 * 
 * MAELEKEZO YA MATUMIZI (HOW TO USE):
 * ----------------------------------
 * 1. Pakia (Upload) faili hili kwenye cPanel File Manager yako (mfano: public_html/selvix_cpanel_db.php).
 * 2. Sanidi SUPABASE_URL na SUPABASE_SERVICE_ROLE_KEY ama kwenye Environment Variables za server/cPanel
 *    au moja kwa moja kwenye Configuration hapa chini (kupitia define).
 * 3. Weka SECRET_KEY yako ya sasa ili kuzuia mtu asiyeidhinishwa kutumia endpoint hizi.
 * 
 * Sasa, mawasiliano yote ya cPanel SQL yataelekezwa moja kwa moja kwenye Supabase kwa usalama wa hali ya juu!
 * Service Role Key haitafichuliwa kabisa upande vya Frontend kwani inabaki upande wa server ya cPanel pekee.
 */

// --- 1. CONFIGURATION / MAZINGIRA (BADILISHA HAPA) ---

// Unaweza kuweka hapa chini au kutumia Environment Variables za cPanel (Inayopendekezwa kwa usalama zaidi)
$envUrl = getenv('SUPABASE_URL');
$envKey = getenv('SUPABASE_SERVICE_ROLE_KEY');

define('SUPABASE_URL', !empty($envUrl) ? $envUrl : 'https://hgwuamjulxpysixjojxp.supabase.co');
define('SUPABASE_SERVICE_ROLE_KEY', !empty($envKey) ? $envKey : 'WEKA_SERVICE_ROLE_KEY_YAKO_YA_SUPABASE'); 

// Majina ya Tables kwenye Supabase
define('SUPABASE_USERS_TABLE', 'users');
define('SUPABASE_TXS_TABLE', 'selvix_transactions');
define('SUPABASE_GAMES_TABLE', 'selvix_games');
define('SUPABASE_CHATS_TABLE', 'selvix_chats');

// Weka neno la siri la kulinda usalama (Secret Key) linalolingana na lile la Admin Panel ya Selvix
define('SECRET_KEY', 'selvix_secure_key_123'); 

// --- 2. USALAMA NA CORS HEADERS ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Selvix-Key, Authorization");
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

// Hakikisha credentials za Supabase zipo
if (empty(SUPABASE_URL) || SUPABASE_SERVICE_ROLE_KEY === 'WEKA_SERVICE_ROLE_KEY_YAKO_YA_SUPABASE' || empty(SUPABASE_SERVICE_ROLE_KEY)) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "UTANGAULIZI: SUPABASE_URL au SUPABASE_SERVICE_ROLE_KEY haijawekwa vizuri kwenye faili la PHP au mazingira ya cPanel."
    ]);
    exit();
}

// --- 3. HELPER FUNCTION TO COMMUNICATE WITH SUPABASE REST API ---
function callSupabase($endpoint, $method = 'GET', $body = null, $extraHeaders = []) {
    $url = rtrim(SUPABASE_URL, '/') . '/' . ltrim($endpoint, '/');
    $ch = curl_init();
    
    $headers = [
        "apikey: " . SUPABASE_SERVICE_ROLE_KEY,
        "Authorization: Bearer " . SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type: application/json"
    ];
    
    foreach ($extraHeaders as $h) {
        $headers[] = $h;
    }
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    } elseif ($method === 'PATCH') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    } elseif ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Inazuia matatizo ya SSL certificates kwenye hosting mbalimbali
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    return [
        "code" => $http_code,
        "response" => $response,
        "error" => $error
    ];
}

// --- 4. SIKILIZA MAOMBI (ENDPOINT ACTIONS) ---
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'ping':
        // Fanya jaribio la kusoma data kidogo kwenye Supabase ili kuthibitisha connection
        $testResult = callSupabase('/rest/v1/' . SUPABASE_USERS_TABLE . '?limit=1', 'GET');
        
        if ($testResult['code'] >= 200 && $testResult['code'] < 300) {
            echo json_encode([
                "success" => true,
                "message" => "Connection ipo vizuri sana! cPanel Bridge imefanikiwa kuunganisha Supabase kikamilifu."
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "cPanel Bridge inafanya kazi, lakini imeshindwa kuwasiliana na Supabase. HTTP Code: " . $testResult['code'] . ". Error: " . $testResult['error'] . ". Response: " . $testResult['response']
            ]);
        }
        break;

    case 'get_user':
        $username = isset($_GET['username']) ? strtolower(trim($_GET['username'])) : '';
        if (empty($username)) {
            echo json_encode(["success" => false, "message" => "Username inahitajika"]);
            break;
        }
        
        $res = callSupabase('/rest/v1/' . SUPABASE_USERS_TABLE . '?username=eq.' . urlencode($username), 'GET');
        
        if ($res['code'] >= 200 && $res['code'] < 300) {
            $data = json_decode($res['response'], true);
            if (is_array($data) && count($data) > 0) {
                $row = $data[0];
                // Hakikisha aina za data zinalingana na mfumo wa sasa
                $row['isAdmin'] = filter_var($row['isAdmin'], FILTER_VALIDATE_BOOLEAN);
                $row['isBlockedFromChatting'] = filter_var($row['isBlockedFromChatting'], FILTER_VALIDATE_BOOLEAN);
                $row['pointsBalance'] = (float)$row['pointsBalance'];
                $row['streakCount'] = (int)$row['streakCount'];
                echo json_encode(["success" => true, "data" => $row]);
            } else {
                echo json_encode(["success" => false, "message" => "Mtumiaji hajapatikana"]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "Kosa la Supabase (HTTP " . $res['code'] . "): " . $res['response']]);
        }
        break;

    case 'save_user':
        $rawData = json_decode(file_get_contents("php://input"), true);
        if (!$rawData || !isset($rawData['username'])) {
            echo json_encode(["success" => false, "message" => "Data hazijakamilika"]);
            break;
        }
        
        // Kutengeneza payload safi ya kuingiza Supabase
        $payload = [
            "username" => strtolower(trim($rawData['username'])),
            "fullName" => trim($rawData['fullName']),
            "phoneNumber" => trim($rawData['phoneNumber']),
            "password" => $rawData['password'],
            "isAdmin" => isset($rawData['isAdmin']) ? filter_var($rawData['isAdmin'], FILTER_VALIDATE_BOOLEAN) : false,
            "isBlockedFromChatting" => isset($rawData['isBlockedFromChatting']) ? filter_var($rawData['isBlockedFromChatting'], FILTER_VALIDATE_BOOLEAN) : false,
            "pointsBalance" => isset($rawData['pointsBalance']) ? (float)$rawData['pointsBalance'] : 100.00,
            "streakCount" => isset($rawData['streakCount']) ? (int)$rawData['streakCount'] : 0,
            "lastRewardClaimedDate" => isset($rawData['lastRewardClaimedDate']) ? trim($rawData['lastRewardClaimedDate']) : '',
            "referredBy" => isset($rawData['referredBy']) ? strtolower(trim($rawData['referredBy'])) : '',
            "createdDate" => isset($rawData['createdDate']) ? trim($rawData['createdDate']) : date('Y-m-d H:i:s')
        ];
        
        // Tumia upsert (kuongeza mpya au kufanya update kama yupo tayari)
        $extraHeaders = [
            "Prefer: resolution=merge-duplicates"
        ];
        
        $res = callSupabase('/rest/v1/' . SUPABASE_USERS_TABLE, 'POST', $payload, $extraHeaders);
        
        if ($res['code'] >= 200 && $res['code'] < 300) {
            echo json_encode(["success" => true, "message" => "Taarifa za mtumiaji zimehifadhiwa/kusawazishwa kwenye Supabase Database."]);
        } else {
            echo json_encode(["success" => false, "message" => "Kosa la kuhifadhi Supabase (HTTP " . $res['code'] . "): " . $res['response']]);
        }
        break;

    case 'insert_transaction':
        $rawData = json_decode(file_get_contents("php://input"), true);
        if (!$rawData || !isset($rawData['reference'])) {
            echo json_encode(["success" => false, "message" => "Data za muamala hazijakamilika"]);
            break;
        }

        $payload = [
            "id" => isset($rawData['id']) ? trim($rawData['id']) : "TX-" . time() . rand(10, 99),
            "reference" => trim($rawData['reference']),
            "username" => strtolower(trim($rawData['username'])),
            "gameId" => (int)$rawData['gameId'],
            "phonenumber" => trim($rawData['phonenumber']),
            "amount" => (float)$rawData['amount'],
            "status" => trim($rawData['status']),
            "created" => isset($rawData['created']) ? trim($rawData['created']) : date('Y-m-d H:i:s')
        ];

        // Upsert muamala
        $extraHeaders = [
            "Prefer: resolution=merge-duplicates"
        ];

        $res = callSupabase('/rest/v1/' . SUPABASE_TXS_TABLE, 'POST', $payload, $extraHeaders);

        if ($res['code'] >= 200 && $res['code'] < 300) {
            echo json_encode(["success" => true, "message" => "Muamala umehifadhiwa Supabase kikamilifu."]);
        } else {
            echo json_encode(["success" => false, "message" => "Kosa la kuhifadhi muamala Supabase (HTTP " . $res['code'] . "): " . $res['response']]);
        }
        break;

    case 'get_all_users':
        $res = callSupabase('/rest/v1/' . SUPABASE_USERS_TABLE . '?select=*', 'GET');
        
        if ($res['code'] >= 200 && $res['code'] < 300) {
            $data = json_decode($res['response'], true);
            $users = [];
            if (is_array($data)) {
                foreach ($data as $row) {
                    $row['isAdmin'] = filter_var($row['isAdmin'], FILTER_VALIDATE_BOOLEAN);
                    $row['isBlockedFromChatting'] = filter_var($row['isBlockedFromChatting'], FILTER_VALIDATE_BOOLEAN);
                    $row['pointsBalance'] = (float)$row['pointsBalance'];
                    $row['streakCount'] = (int)$row['streakCount'];
                    $users[$row['username']] = $row;
                }
            }
            echo json_encode(["success" => true, "data" => $users]);
        } else {
            echo json_encode(["success" => false, "message" => "Kosa la Supabase (HTTP " . $res['code'] . "): " . $res['response']]);
        }
        break;

    case 'get_all_games':
        $res = callSupabase('/rest/v1/' . SUPABASE_GAMES_TABLE . '?select=*&order=id.asc', 'GET');
        if ($res['code'] >= 200 && $res['code'] < 300) {
            $data = json_decode($res['response'], true);
            if (is_array($data)) {
                foreach ($data as &$row) {
                    $row['id'] = (int)$row['id'];
                    $row['isPaid'] = filter_var($row['isPaid'], FILTER_VALIDATE_BOOLEAN);
                    $row['price'] = (float)$row['price'];
                }
            }
            echo json_encode(["success" => true, "data" => $data]);
        } else {
            echo json_encode(["success" => false, "message" => "Kosa la Supabase (HTTP " . $res['code'] . "): " . $res['response']]);
        }
        break;

    case 'save_game':
        $rawData = json_decode(file_get_contents("php://input"), true);
        if (!$rawData || !isset($rawData['id'])) {
            echo json_encode(["success" => false, "message" => "Data za mchezo hazijakamilika"]);
            break;
        }
        $payload = [
            "id" => (int)$rawData['id'],
            "title" => trim($rawData['title']),
            "imageUrl" => trim($rawData['imageUrl']),
            "category" => trim($rawData['category']),
            "isPaid" => isset($rawData['isPaid']) ? filter_var($rawData['isPaid'], FILTER_VALIDATE_BOOLEAN) : false,
            "price" => isset($rawData['price']) ? (float)$rawData['price'] : 0.00,
            "downloadUrl" => trim($rawData['downloadUrl']),
            "description" => isset($rawData['description']) ? trim($rawData['description']) : ''
        ];
        $extraHeaders = ["Prefer: resolution=merge-duplicates"];
        $res = callSupabase('/rest/v1/' . SUPABASE_GAMES_TABLE, 'POST', $payload, $extraHeaders);
        if ($res['code'] >= 200 && $res['code'] < 300) {
            echo json_encode(["success" => true, "message" => "Mchezo umehifadhiwa/kusawazishwa."]);
        } else {
            echo json_encode(["success" => false, "message" => "Kosa la kuhifadhi mchezo (HTTP " . $res['code'] . "): " . $res['response']]);
        }
        break;

    case 'delete_game':
        $rawData = json_decode(file_get_contents("php://input"), true);
        $id = isset($rawData['id']) ? (int)$rawData['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);
        if (!$id) {
            echo json_encode(["success" => false, "message" => "ID ya mchezo haijatolewa"]);
            break;
        }
        $res = callSupabase('/rest/v1/' . SUPABASE_GAMES_TABLE . '?id=eq.' . $id, 'DELETE');
        if ($res['code'] >= 200 && $res['code'] < 300) {
            echo json_encode(["success" => true, "message" => "Mchezo umefutwa."]);
        } else {
            echo json_encode(["success" => false, "message" => "Kosa la kufuta mchezo (HTTP " . $res['code'] . "): " . $res['response']]);
        }
        break;

    case 'get_all_chats':
        $res = callSupabase('/rest/v1/' . SUPABASE_CHATS_TABLE . '?select=*&order=id.asc', 'GET');
        if ($res['code'] >= 200 && $res['code'] < 300) {
            $data = json_decode($res['response'], true);
            if (is_array($data)) {
                foreach ($data as &$row) {
                    $row['id'] = (int)$row['id'];
                    $row['isSocial'] = filter_var($row['isSocial'], FILTER_VALIDATE_BOOLEAN);
                }
            }
            echo json_encode(["success" => true, "data" => $data]);
        } else {
            echo json_encode(["success" => false, "message" => "Kosa la Supabase (HTTP " . $res['code'] . "): " . $res['response']]);
        }
        break;

    case 'save_chat':
        $rawData = json_decode(file_get_contents("php://input"), true);
        if (!$rawData || !isset($rawData['id'])) {
            echo json_encode(["success" => false, "message" => "Data za soga hazijakamilika"]);
            break;
        }
        $payload = [
            "id" => (int)$rawData['id'],
            "senderUsername" => trim($rawData['senderUsername']),
            "senderFullName" => trim($rawData['senderFullName']),
            "message" => trim($rawData['message']),
            "isSocial" => isset($rawData['isSocial']) ? filter_var($rawData['isSocial'], FILTER_VALIDATE_BOOLEAN) : true,
            "timestamp" => isset($rawData['timestamp']) ? trim($rawData['timestamp']) : date('Y-m-d H:i:s')
        ];
        $extraHeaders = ["Prefer: resolution=merge-duplicates"];
        $res = callSupabase('/rest/v1/' . SUPABASE_CHATS_TABLE, 'POST', $payload, $extraHeaders);
        if ($res['code'] >= 200 && $res['code'] < 300) {
            echo json_encode(["success" => true, "message" => "Ujumbe umehifadhiwa."]);
        } else {
            echo json_encode(["success" => false, "message" => "Kosa la kuhifadhi ujumbe (HTTP " . $res['code'] . "): " . $res['response']]);
        }
        break;

    case 'delete_chat':
        $rawData = json_decode(file_get_contents("php://input"), true);
        $id = isset($rawData['id']) ? (int)$rawData['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);
        if (!$id) {
            echo json_encode(["success" => false, "message" => "ID ya ujumbe haijatolewa"]);
            break;
        }
        $res = callSupabase('/rest/v1/' . SUPABASE_CHATS_TABLE . '?id=eq.' . $id, 'DELETE');
        if ($res['code'] >= 200 && $res['code'] < 300) {
            echo json_encode(["success" => true, "message" => "Ujumbe umefutwa."]);
        } else {
            echo json_encode(["success" => false, "message" => "Kosa la kufuta ujumbe (HTTP " . $res['code'] . "): " . $res['response']]);
        }
        break;

    case 'get_all_transactions':
        $res = callSupabase('/rest/v1/' . SUPABASE_TXS_TABLE . '?select=*', 'GET');
        if ($res['code'] >= 200 && $res['code'] < 300) {
            $data = json_decode($res['response'], true);
            if (is_array($data)) {
                foreach ($data as &$row) {
                    $row['gameId'] = (int)$row['gameId'];
                    $row['amount'] = (float)$row['amount'];
                }
            }
            echo json_encode(["success" => true, "data" => $data]);
        } else {
            echo json_encode(["success" => false, "message" => "Kosa la Supabase (HTTP " . $res['code'] . "): " . $res['response']]);
        }
        break;

    default:
        echo json_encode([
            "success" => false,
            "message" => "Action haitambuliwi. Jaribu ping, get_user, save_user, au get_all_games."
        ]);
        break;
}
?>
