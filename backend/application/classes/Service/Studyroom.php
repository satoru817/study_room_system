<?php defined('SYSPATH') or die('No direct script access');

final class Service_Studyroom {
    public static function getStudyRoomsOfCramSchool(int $cramschoolId)
    {
        return Repository_Studyroom::find_all_by_cramschoolId($cramschoolId);
    }

    public static function create($data)
    {
        return Repository_Studyroom::create($data['cramschool_id'], $data['name'], $data['room_limit']);
    }
}