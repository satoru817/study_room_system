<?php defined('SYSPATH') or die('No direct script access.');

class Controller_Api_Auth extends Controller_Api_Base {
    /**
     * Login
     * POST /api/auth/login
     */
public function action_login() {
    error_log('✅ action_login に到達した');
    $this->require_post();

    $data = $this->get_json_body();

    // JSON配列をログ出力
    error_log('$data = ' . print_r($data, true));

    $login_name = $data['login_name'] ?? null;
    $password = $data['password'] ?? null;

    error_log('login_name = ' . $login_name);
    error_log('password = ' . $password);

    if (!$login_name || !$password) {
        error_log('❌ ログイン情報が不足');
        return $this->error('Invalid credentials', 401);
    }

    // --- ここでService_Auth::login()を呼び出す ---
    $user = Service_Auth::login($login_name, $password);

    // --- $userがnullか確認 ---
    if ($user === null) {
        error_log('❌ $user は null（ログイン失敗）');
        return $this->error('Invalid credentials', 401);
    } else {
        error_log('✅ $user オブジェクトが生成された: ' . print_r($user->toArray(), true));
    }

    // --- トークン生成前にログ ---
    error_log('🔧 トークン生成開始');

    $token = Service_Auth::generate_token($user);

    // --- トークン生成後のログ ---
    error_log('✅ トークン生成成功: ' . $token);

    $this->json([
        'token' => $token,
        'user' => $user->toArray()
    ]);
}


}