<?php defined('SYSPATH') or die('No direct script access.');

class Controller_Test extends Controller {
    public function action_db() {
        try {
            $result = DB::query(Database::SELECT, 'SELECT 1 as test')
                -> execute()
                -> current();

            echo "データベース接続成功!<br>";
            echo "Test value: ".$result['test']."<br>";

            $tables = DB::query(Database::SELECT, 'SHOW TABLES')
                -> execute()
                -> as_array();

            echo "<h2>テーブル一覧</h2>";
            echo "<pre>";
            print_r($tables);
            echo "</pre>";
        } catch (Exception $e) {
            echo "データベース接続エラー";
            echo $e -> getMessage();
        }
    }

}