<?php defined('SYSPATH') or die('No direct script access');
//TODO: improve security (don't allow other cram_school's teacher to modify )
final class Controller_Api_Studyroom extends Controller_Api_Base {
    
    public function action_get()
    {
        $this -> require_teacher();
        $cramschool_id = $this->request -> param('id');
        $studyRooms = Service_Studyroom::getStudyRoomsOfCramSchool($cramschool_id);
        $this -> json($studyRooms);
    }

    public function action_create()
    {
        $this->require_teacher();
        $data = $this->get_json_body();
        $studyRoom = Service_Studyroom::create($data);
        $this->json($studyRoom);
    }


}