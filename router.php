<?php

$documentRoot = __DIR__;
$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$requestPath = rawurldecode($requestUri ?: '/');
$normalizedPath = ltrim(str_replace('\\', '/', $requestPath), '/');

if ($normalizedPath === '') {
    $normalizedPath = 'index.html';
}

$resolvedPath = $documentRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $normalizedPath);

if (is_file($resolvedPath)) {
    return false;
}

if (is_dir($resolvedPath)) {
    foreach (['index.php', 'index.html'] as $indexFile) {
        $candidate = $resolvedPath . DIRECTORY_SEPARATOR . $indexFile;
        if (is_file($candidate)) {
            $_SERVER['SCRIPT_NAME'] = $requestPath . (substr($requestPath, -1) === '/' ? '' : '/') . $indexFile;
            $_SERVER['SCRIPT_FILENAME'] = $candidate;
            include $candidate;
            return true;
        }
    }
}

$errorPage = $documentRoot . DIRECTORY_SEPARATOR . '404' . DIRECTORY_SEPARATOR . 'index.html';
$errorMarkup = file_get_contents($errorPage);

if ($errorMarkup === false) {
    http_response_code(404);
    echo '404 Not Found';
    return true;
}

http_response_code(404);
header('Content-Type: text/html; charset=UTF-8');
echo str_replace('<base href="../">', '<base href="/">', $errorMarkup);
return true;
