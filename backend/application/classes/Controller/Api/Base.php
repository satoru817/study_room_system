<?php defined('SYSPATH') or die('No direct script access.');

abstract class Controller_Api_Base extends Controller {

    protected ?Entity_User $current_user = null;  // nullable ? 

    public function before() {
        parent::before();

        // CORS対応
        $this->response->headers('Access-Control-Allow-Origin', '*');
        $this->response->headers('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $this->response->headers('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // OPTIONSリクエスト（プリフライト）への対応
        if ($this->request->method() === HTTP_Request::OPTIONS) {
            $this->response->status(200);
            exit;
        }
    }

    /**
     * 認証チェック
     */
    protected function require_auth() {
        $token = $this->get_auth_token();

        if (!$token) {
            $this->error('Unauthorized', 401);
            exit;
        }

        $this->current_user = Service_Auth::verify_token($token);

        if (!$this->current_user) {
            $this->error('Invalid token', 401);
            exit;
        }
    }

    /**
     * 生徒のみ許可
     */
    protected function require_student() {
        $this->require_auth();

        if (!$this->current_user->isStudent()) {
            $this->error('Students only', 403);
            exit;
        }
    }

    protected function require_teacher()
    {
        $this->require_auth();

        if (!$this->current_user->isTeacher()) 
        {
            $this -> error('Teacher only', 403);
            exit;
        }
    }

    /**
     * Authorizationヘッダーからトークンを取得
     */
    private function get_auth_token() {
        $header = $this->request->headers('Authorization');

        if ($header && preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * HTTPメソッドチェック
     */
    protected function require_get() {
        if ($this->request->method() !== HTTP_Request::GET) {
            $this->error('Method not allowed', 405);
            exit;
        }
    }

    protected function require_post() {
        if ($this->request->method() !== HTTP_Request::POST) {
            $this->error('Method not allowed', 405);
            exit;
        }
    }

    /**
     * リクエストボディをJSONとして取得
     */
    protected function get_json_body() {
        return json_decode($this->request->body(), true) ?? [];
    }

    /**
     *  return JSON response
     */
    protected function json($data, $status = 200) {
        $this->response->status($status);
        $this->response->headers('Content-Type', 'application/json; charset=utf-8');

        if (is_object($data) && method_exists($data, 'toArray')) {
            $data = $data->toArray();
        }

        if (is_array($data)) {
            $data = array_map(function($item) {
                if (is_object($item) && method_exists($item, 'toArray')) {
                    return $item->toArray();
                }
                return $item;
            }, $data);
        }

        $this->response->body(json_encode($data, JSON_UNESCAPED_UNICODE));
    }

    /**
     * エラーレスポンス
     */
    protected function error($message, $status = 400) {
        $this->json(['error' => $message], $status);
    }
}