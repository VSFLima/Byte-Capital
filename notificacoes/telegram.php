<?php
// ===================================================================================
// ARQUIVO: telegram.php
// RESPONSABILIDADE: Receber dados da aplicação Byte Capital e enviar notificações
// formatadas para o administrador via Telegram.
// ===================================================================================

// --- CABEÇALHOS DE SEGURANÇA E CONFIGURAÇÃO ---
// Permite que a sua aplicação (de qualquer domínio) envie dados para este script.
// Para mais segurança em produção, pode restringir ao domínio do seu site.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Responde a pedidos OPTIONS (pre-flight requests) que os navegadores enviam.
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// --- LÓGICA PRINCIPAL ---

// Apenas aceita pedidos do tipo POST por segurança.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['status' => 'error', 'message' => 'Apenas o método POST é permitido.']);
    exit();
}

// Pega os dados JSON enviados pelo JavaScript.
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

// Validação dos dados recebidos.
if (!isset($data['action']) || !isset($data['details']) || !isset($data['config'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['status' => 'error', 'message' => 'Dados em falta no pedido.']);
    exit();
}

// Extrai os dados para variáveis mais fáceis de usar.
$action = $data['action'];
$details = $data['details'];
$config = $data['config'];

$botToken = $config['telegramToken'];
$chatId = $config['telegramChatId'];

// Variável que irá guardar a nossa mensagem final.
$mensagem = "";

// --- REAÇÃO A CADA TIPO DE AÇÃO ---

// Usamos um switch para reagir de forma diferente a cada 'action'.
switch ($action) {
    case 'novo_deposito':
        $nome = htmlspecialchars($details['nome']);
        $valor = htmlspecialchars($details['valor']);
        $mensagem = "🔔 Novo Pedido de Depósito na Byte Capital!\n\n" .
                    "👤 Utilizador: " . $nome . "\n" .
                    "💰 Valor: " . $valor . "\n\n" .
                    "➡️ Ação Necessária: Aceda ao painel de administração para aprovar o depósito e creditar o saldo.";
        break;

    case 'novo_saque':
        $nome = htmlspecialchars($details['nome']);
        $valor = htmlspecialchars($details['valor']);
        $status = htmlspecialchars($details['status']);
        $mensagem = "🔔 Novo Pedido de Saque na Byte Capital!\n\n" .
                    "👤 Utilizador: " . $nome . "\n" .
                    "💰 Valor: " . $valor . "\n" .
                    "🚦 Estado: " . ($status == 'em_analise' ? 'EM ANÁLISE (CPF diferente)' : 'Pendente') . "\n\n" .
                    "➡️ Ação Necessária: Aceda ao painel para processar o pagamento.";
        break;

    case 'novo_usuario':
        $nome = htmlspecialchars($details['nome']);
        $email = htmlspecialchars($details['email']);
        $mensagem = "🎉 Novo Registo na Byte Capital!\n\n" .
                    "👤 Nome: " . $nome . "\n" .
                    "📩 Email: " . $email;
        break;
        
    case 'suporte':
        $nome = htmlspecialchars($details['nome']);
        $mensagemTexto = htmlspecialchars($details['mensagem']);
        $mensagem = "💬 Nova Mensagem de Suporte na Byte Capital!\n\n" .
                    "👤 Utilizador: " . $nome . "\n" .
                    "📝 Mensagem: " . $mensagemTexto;
        break;

    default:
        // Se a ação não for reconhecida, não fazemos nada.
        echo json_encode(['status' => 'success', 'message' => 'Ação não requer notificação.']);
        exit();
}

// --- FUNÇÃO DE ENVIO PARA O TELEGRAM ---

/**
 * Envia a mensagem formatada para a API do Telegram.
 * @param string $token - O token do bot.
 * @param string $chat_id - O ID da conversa.
 * @param string $message - A mensagem a ser enviada.
 * @return bool - True se a mensagem foi enviada, false caso contrário.
 */
function enviarNotificacaoTelegram($token, $chat_id, $message) {
    if (empty($token) || empty($chat_id)) {
        return false;
    }
    $url = "https://api.telegram.org/bot" . $token . "/sendMessage?chat_id=" . $chat_id . "&text=" . urlencode($message);
    
    // Usar cURL para um método mais robusto (se disponível na sua hospedagem)
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    
    return $response !== false;
}

// Envia a notificação e retorna uma resposta para o JavaScript.
if (enviarNotificacaoTelegram($botToken, $chatId, $mensagem)) {
    echo json_encode(['status' => 'success', 'message' => 'Notificação enviada.']);
} else {
    http_response_code(500); // Internal Server Error
    echo json_encode(['status' => 'error', 'message' => 'Falha ao enviar notificação. Verifique o Token e o Chat ID.']);
}

?>

<?php
// ===================================================================================
// ARQUIVO: telegram.php
// RESPONSABILIDADE: Receber dados da aplicação Byte Capital e enviar notificações
// formatadas para o administrador via Telegram.
// ===================================================================================

// --- CABEÇALHOS DE SEGURANÇA E CONFIGURAÇÃO ---
// Permite que a sua aplicação (de qualquer domínio) envie dados para este script.
// Para mais segurança em produção, pode restringir ao domínio do seu site.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Responde a pedidos OPTIONS (pre-flight requests) que os navegadores enviam.
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// --- LÓGICA PRINCIPAL ---

// Apenas aceita pedidos do tipo POST por segurança.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['status' => 'error', 'message' => 'Apenas o método POST é permitido.']);
    exit();
}

// Pega os dados JSON enviados pelo JavaScript.
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

// Validação dos dados recebidos.
if (!isset($data['action']) || !isset($data['details']) || !isset($data['config'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['status' => 'error', 'message' => 'Dados em falta no pedido.']);
    exit();
}

// Extrai os dados para variáveis mais fáceis de usar.
$action = $data['action'];
$details = $data['details'];
$config = $data['config'];

$botToken = $config['telegramToken'];
$chatId = $config['telegramChatId'];

// Variável que irá guardar a nossa mensagem final.
$mensagem = "";

// --- REAÇÃO A CADA TIPO DE AÇÃO ---

// Usamos um switch para reagir de forma diferente a cada 'action'.
switch ($action) {
    case 'novo_deposito':
        $nome = htmlspecialchars($details['nome']);
        $valor = htmlspecialchars($details['valor']);
        $mensagem = "🔔 Novo Pedido de Depósito na Byte Capital!\n\n" .
                    "👤 Utilizador: " . $nome . "\n" .
                    "💰 Valor: " . $valor . "\n\n" .
                    "➡️ Ação Necessária: Aceda ao painel de administração para aprovar o depósito e creditar o saldo.";
        break;

    case 'novo_saque':
        $nome = htmlspecialchars($details['nome']);
        $valor = htmlspecialchars($details['valor']);
        $status = htmlspecialchars($details['status']);
        $mensagem = "🔔 Novo Pedido de Saque na Byte Capital!\n\n" .
                    "👤 Utilizador: " . $nome . "\n" .
                    "💰 Valor: " . $valor . "\n" .
                    "🚦 Estado: " . ($status == 'em_analise' ? 'EM ANÁLISE (CPF diferente)' : 'Pendente') . "\n\n" .
                    "➡️ Ação Necessária: Aceda ao painel para processar o pagamento.";
        break;

    case 'novo_usuario':
        $nome = htmlspecialchars($details['nome']);
        $email = htmlspecialchars($details['email']);
        $mensagem = "🎉 Novo Registo na Byte Capital!\n\n" .
                    "👤 Nome: " . $nome . "\n" .
                    "📩 Email: " . $email;
        break;
        
    case 'suporte':
        $nome = htmlspecialchars($details['nome']);
        $mensagemTexto = htmlspecialchars($details['mensagem']);
        $mensagem = "💬 Nova Mensagem de Suporte na Byte Capital!\n\n" .
                    "👤 Utilizador: " . $nome . "\n" .
                    "📝 Mensagem: " . $mensagemTexto;
        break;

    default:
        // Se a ação não for reconhecida, não fazemos nada.
        echo json_encode(['status' => 'success', 'message' => 'Ação não requer notificação.']);
        exit();
}

// --- FUNÇÃO DE ENVIO PARA O TELEGRAM ---

/**
 * Envia a mensagem formatada para a API do Telegram.
 * @param string $token - O token do bot.
 * @param string $chat_id - O ID da conversa.
 * @param string $message - A mensagem a ser enviada.
 * @return bool - True se a mensagem foi enviada, false caso contrário.
 */
function enviarNotificacaoTelegram($token, $chat_id, $message) {
    if (empty($token) || empty($chat_id)) {
        return false;
    }
    $url = "https://api.telegram.org/bot" . $token . "/sendMessage?chat_id=" . $chat_id . "&text=" . urlencode($message);
    
    // Usar cURL para um método mais robusto (se disponível na sua hospedagem)
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    
    return $response !== false;
}

// Envia a notificação e retorna uma resposta para o JavaScript.
if (enviarNotificacaoTelegram($botToken, $chatId, $mensagem)) {
    echo json_encode(['status' => 'success', 'message' => 'Notificação enviada.']);
} else {
    http_response_code(500); // Internal Server Error
    echo json_encode(['status' => 'error', 'message' => 'Falha ao enviar notificação. Verifique o Token e o Chat ID.']);
}

?>

