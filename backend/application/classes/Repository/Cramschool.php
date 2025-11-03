<?php defined('SYSPATH') or die('No direct script access');

class Repository_Cramschool {
    /**
     * get teachers all Cramschool
     */
    public static function find_all_by_teacher(Entity_Teacher $teacher)
    {
        try {
            error_log("========== find_all_by_teacher 開始 ==========");
            
            $cramschoolIds = $teacher->getCramschoolIds();
            error_log("取得したcramschoolIds: " . print_r($cramschoolIds, true));
            
            if (empty($cramschoolIds)) {
                error_log("⚠️ cramschoolIds が空です");
                return array();
            }

            error_log("SQL実行前 - cramschoolIds: " . implode(',', $cramschoolIds));

            $results = DB::select(
                    array('cram_school_id', 'cramschoolId'),
                    'name'
                )
                ->from('cram_schools')
                ->where('cram_school_id', 'IN', $cramschoolIds)
                ->execute(Database::instance())
                ->as_array();

            error_log("SQL実行後 - 取得件数: " . count($results));
            error_log("取得結果: " . print_r($results, true));

            $cramschools = array();

            foreach ($results as $result) {
                error_log("処理中のレコード: " . print_r($result, true));
                $cramschools[] = Entity_Cramschool::fromArray($result);
            }
            
            error_log("最終的な配列数: " . count($cramschools));
            error_log("========== find_all_by_teacher 終了 ==========");
            
            return $cramschools;

        } catch (Database_Exception $e) {
            error_log("❌ find_all_by_teacher DBエラー: " . $e->getMessage());
            error_log("スタックトレース: " . $e->getTraceAsString());
            return null;
        } catch (Exception $e) {
            error_log("❌ find_all_by_teacher 予期せぬエラー: " . $e->getMessage());
            error_log("スタックトレース: " . $e->getTraceAsString());
            return null;
        }
    }
}