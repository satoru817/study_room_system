<?php defined('SYSPATH') or die('No direct script access.');

final class Service_Cramschool {
    
    public static function getTeachers(Entity_Teacher $teacher)
    {
        return Repository_Cramschool::find_all_by_teacher($teacher);
    }

}