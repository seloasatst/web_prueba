<?php
/**
 * SELOASA - Acceso Directo Prohibido
 */
http_response_code(403);
header('Content-Type: text/plain; charset=UTF-8');
exit('403 Forbidden: El acceso directo a este directorio esta estrictamente restringido.');
