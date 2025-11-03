<?php defined('SYSPATH') or die('No direct script access');

class Repository_Teacher {
    /**
     * get teacher by login_name ( = email)
     */
public static function find_by_login($login_name) {
    try {
        error_log('Repository_Teacher::find_by_login に来ています');
        error_log('login_name = ' . $login_name);

        $result = DB::query(Database::SELECT, "
            SELECT
                u.user_id AS id,
                u.name,
                u.password,
                GROUP_CONCAT(csu.cram_school_id) AS cramSchoolIds
            FROM users u
            JOIN cram_school_users csu
                ON csu.user_id = u.user_id 
                AND u.email = :login_name
            GROUP BY u.user_id, u.name, u.password
        ")
        ->param(':login_name', $login_name)
        ->execute(Database::instance())
        ->current();

        if (!$result) {
            // データが見つからない場合
            error_log("⚠️ Repository_Teacher::find_by_login: 該当ユーザーなし -> {$login_name}");
            return null;
        }

        // 正常取得時
        error_log('✅ Repository_Teacher::find_by_login 成功: ' . json_encode($result));
        return $result;

    } catch (Database_Exception $e) {
        // SQL構文エラーや接続不良など
        error_log("❌ Repository_Teacher::find_by_login DBエラー: " . $e->getMessage());
        return null;

    } catch (Exception $e) {
        // 予期せぬ例外
        error_log("❌ Repository_Teacher::find_by_login 予期せぬエラー: " . $e->getMessage());
        return null;
    }
}

}