<?php defined('SYSPATH') or die('No direct script access');

class Repository_Cramschool {
    /**
     * get teachers all Cramschool
     */
    public static function find_all_by_teacher(Entity_Teacher $teacher)
    {
        try {
            $cramschoolIds = $teacher->getCramschoolIds();
            
            if (empty($cramschoolIds)) {
                return array();
            }

            $results = DB::select(
                    array('cram_school_id', 'cramschoolId'),
                    'name'
                )
                ->from('cram_schools')
                ->where('cram_school_id', 'IN', $cramschoolIds)
                ->execute(Database::instance())
                ->as_array();


            $cramschools = array();

            foreach ($results as $result) {
                $cramschools[] = Entity_Cramschool::fromArray($result);
            }
            
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