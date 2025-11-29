<?php
// Hostinger PHP bootstrap file
// This starts the Node.js server and serves the React app

// Set environment variables directly in code (since Hostinger Git doesn't have env var interface)
putenv('NODE_ENV=production');
putenv('MONGODB_URI=mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/');
putenv('JWT_SECRET=goldust-production-jwt-secret-key-2024');
putenv('PORT=5051');

// Check if Node.js server is running
$serverUrl = 'http://localhost:5051';
$ch = curl_init($serverUrl . '/api/test');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 2);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// If server is not running, start it
if ($httpCode !== 200) {
    // Start Node.js server in background
    shell_exec('cd ' . __DIR__ . ' && npm install > /dev/null 2>&1 &');
    shell_exec('cd ' . __DIR__ . ' && node app.js > /dev/null 2>&1 &');
    sleep(3); // Wait for server to start
}

// Get the request URI
$request = $_SERVER['REQUEST_URI'];

// Handle API requests - proxy to Node.js
if (strpos($request, '/api/') === 0) {
    $nodeUrl = 'http://localhost:5051' . $request;
    
    // Forward the request to Node.js
    $ch = curl_init($nodeUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
    
    // Forward POST data
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
    }
    
    // Forward headers
    $headers = [];
    foreach (getallheaders() as $key => $value) {
        $headers[] = $key . ': ' . $value;
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    http_response_code($httpCode);
    echo $response;
    exit;
}

// Handle uploads and gallery requests - proxy to Node.js
if (strpos($request, '/uploads/') === 0 || strpos($request, '/gallery/') === 0) {
    $nodeUrl = 'http://localhost:5051' . $request;
    
    $ch = curl_init($nodeUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    http_response_code($httpCode);
    echo $response;
    exit;
}

// For all other requests, serve the React app
$filePath = __DIR__ . '/public_html' . $request;

// If it's a file that exists, serve it
if (file_exists($filePath) && !is_dir($filePath)) {
    $mimeType = mime_content_type($filePath);
    header('Content-Type: ' . $mimeType);
    readfile($filePath);
    exit;
}

// Otherwise, serve index.html for React Router
if (file_exists(__DIR__ . '/public_html/index.html')) {
    header('Content-Type: text/html');
    readfile(__DIR__ . '/public_html/index.html');
} else {
    http_response_code(404);
    echo '404 - File not found';
}
?>