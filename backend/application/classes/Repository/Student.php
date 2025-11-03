<?php defined('SYSPATH') or die('No direct script access');

class Repository_Student {
    /**
     * get student by login_name
     */
    public static function find_by_login($login_name) {
        try {
            $result = DB::query(Database::SELECT, "
                SELECT 
                    s.student_id AS id,
                    sli.login_name AS name,
                    s.el1,
                    COALESCE(cs.name, '校舎未設定') AS cramSchoolName,
                    COALESCE(cs.email, '') AS cramSchoolEmail,
                    COALESCE(s.mail, '') AS studentEmail,
                    COALESCE(cs.line_channel_token, '') AS lineChannelToken,
                    COALESCE(s.line_user_id, '') AS lineUserId,
                    sli.password
                FROM students s
                JOIN student_login_infos sli 
                    ON sli.student_id = s.student_id 
                    AND sli.login_name = :login_name
                JOIN cram_schools cs
                    ON cs.cram_school_id = s.cram_school_id
            ")
            ->param(':login_name', $login_name)
            ->execute(Database::instance())
            ->current();

            if (!$result) {
                // データが見つからなかった場合
                error_log("⚠️ find_by_login: 該当ユーザーなし -> {$login_name}");
                return null;
            }

            return $result;

        } catch (Database_Exception $e) {
            // DB接続やSQLエラーなど
            error_log("❌ find_by_login DBエラー: " . $e->getMessage());
            return null;
        } catch (Exception $e) {
            // その他の例外
            error_log("❌ find_by_login 予期せぬエラー: " . $e->getMessage());
            return null;
        }
    }


}