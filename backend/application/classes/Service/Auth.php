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

    /**
     * JWTトークンを生成
     */
    public static function generate_token(Entity_User $user) {
        error_log('🟩 generate_token() 呼び出し');
        error_log('👤 ユーザー情報: ' . json_encode($user->toArray(), JSON_UNESCAPED_UNICODE));

        $payload = [
            'iss' => 'study_room_system',  // 発行者
            'iat' => time(),               // 発行時刻
            'exp' => time() + (60 * 60 * 24),  // 有効期限（24時間）
            'user' => $user->toArray()
        ];

        error_log('📦 JWTペイロード: ' . json_encode($payload, JSON_UNESCAPED_UNICODE));

        $token = JWT::encode($payload, self::$secret_key, 'HS256');

        error_log('✅ JWT生成完了: ' . substr($token, 0, 40) . '...'); // 長すぎるので一部だけ出力
        return $token;
    }



    public static function verify_token($token) {
        try {
            $decoded = JWT::decode($token, new Key(self::$secret_key, 'HS256'));
            
            $userData = (array) $decoded->user;
            
            // Entityクラスに変換（EntityクラスにfromArrayメソッドがあると仮定）
            if ($decoded->user->role === 'teacher') {
                return Entity_Teacher::fromArrayOfArray($userData);
            } 
            elseif ($decoded->user->role === 'student') {
                return Entity_Student::fromArray($userData);
            }
            
            return null;

        } catch (Exception $e) {
            error_log("Token verification failed: " . $e->getMessage());
            return null;
        }
    }
}