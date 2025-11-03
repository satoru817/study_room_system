<?php defined('SYSPATH') or die('No direct script access.');

class Controller_Api_Auth extends Controller_Api_Base {
    /**
     * Login
     * POST /api/auth/login
     */
    public function action_login() {
        $this->require_post();

        $data = $this->get_json_body();

        $login_name = $data['login_name'] ?? null;
        $password = $data['password'] ?? null;

        error_log('login_name = ' . $login_name);
        error_log('password = ' . $password);

        if (!$login_name || !$password) {
            return $this->error('Invalid credentials', 401);
        }

        $user = Service_Auth::login($login_name, $password);
        if (!$user) {
            return $this->error('Invalid credentials' , 401);
        }

        $token = Service_Auth::generate_token($user);
        
        error_log('token = '.$token);
        $this->json([
            'token' => $token,
            'user' => $user->toArray()
        ]);
    }

}