<?php
// Simple PHP router for Hostinger Git deployment
// Serves the React app and provides basic API error handling

// Get the request URI
$request = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Handle API requests - show maintenance message
if (strpos($request, '/api/') === 0) {
    header('Content-Type: application/json');
    http_response_code(503);
    echo json_encode([
        'error' => 'API temporarily unavailable',
        'message' => 'Backend server is starting up. Please try again in a few moments.',
        'status' => 503
    ]);
    exit;
}

// Handle uploads and gallery requests
if (strpos($request, '/uploads/') === 0 || strpos($request, '/gallery/') === 0) {
    header('Content-Type: application/json');
    http_response_code(503);
    echo json_encode([
        'error' => 'File service temporarily unavailable',
        'message' => 'File server is starting up. Please try again in a few moments.',
        'status' => 503
    ]);
    exit;
}

// For all other requests, serve the React app
$filePath = __DIR__ . '/public_html' . $request;

// If it's a static file that exists, serve it
if (file_exists($filePath) && !is_dir($filePath)) {
    $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    
    // Set appropriate content type
    switch ($extension) {
        case 'js':
            header('Content-Type: application/javascript');
            break;
        case 'css':
            header('Content-Type: text/css');
            break;
        case 'json':
            header('Content-Type: application/json');
            break;
        case 'png':
            header('Content-Type: image/png');
            break;
        case 'jpg':
        case 'jpeg':
            header('Content-Type: image/jpeg');
            break;
        case 'svg':
            header('Content-Type: image/svg+xml');
            break;
        default:
            header('Content-Type: text/plain');
    }
    
    readfile($filePath);
    exit;
}

// Otherwise, serve index.html for React Router
if (file_exists(__DIR__ . '/public_html/index.html')) {
    header('Content-Type: text/html');
    readfile(__DIR__ . '/public_html/index.html');
} else {
    http_response_code(404);
    echo '<!DOCTYPE html>
    <html>
    <head>
        <title>Goldust Creation - Loading</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .loading { color: #d4af37; font-size: 24px; }
        </style>
    </head>
    <body>
        <div class="loading">
            <h1>Goldust Creation</h1>
            <p>Application is loading...</p>
            <p>Please wait while we set up your experience.</p>
        </div>
    </body>
    </html>';
}
?>