<?php defined('SYSPATH') or die('No direct script access.');

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class Service_Auth {

    private static $secret_key = 'your-secret-key-change-this-in-production';

    /**
     * ログイン
     */
    public static function login($login_name, $password) {
        $student = Repository_Student::find_by_login($login_name);

        if ($student && password_verify($password, $student['password'])) {
            return Entity_Student::fromArray($student);
        }

        $teacher = Repository_Teacher::find_by_login($login_name);
        if($teacher && password_verify($password, $teacher['password'])) {
            error_log('teacher = ' . json_encode($teacher, JSON_UNESCAPED_UNICODE));

            return Entity_Teacher::fromArray($teacher);// up to here everything is perfect.
        }

        return null;
    }

public static function generate_token(Entity_User $user) {
    error_log('🟩 generate_token() 呼び出し');
    error_log('👤 ユーザー情報: ' . json_encode($user->toArray(), JSON_UNESCAPED_UNICODE));

    $payload = [
        'iss' => 'study_room_system',
        'iat' => time(),
        'exp' => time() + (60 * 60 * 24),
        'user' => $user->toArray()
    ];

    error_log('📦 JWTペイロード: ' . json_encode($payload, JSON_UNESCAPED_UNICODE));
    error_log('🔑 secret_key = ' . (self::$secret_key ?? 'NULL'));

    try {
        $token = JWT::encode($payload, self::$secret_key, 'HS256');
        error_log('✅ JWT生成完了: ' . substr($token, 0, 40) . '...');
        return $token;
    } catch (Throwable $e) {
        error_log('❌ JWT生成エラー: ' . $e->getMessage());
        error_log($e->getTraceAsString());
        throw $e;
    }
}




    /**
     * JWTトークンを検証してユーザーを取得
     */
    public static function verify_token($token) {
        try {
            $decoded = JWT::decode($token, new Key(self::$secret_key, 'HS256'));

            $user = $decoded->user;

            return $user;

        } catch (Exception $e) {
            return null;
        }
    }
}