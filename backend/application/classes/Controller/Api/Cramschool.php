<?php defined('SYSPATH') or die('No direct scritp access');

class Controller_Api_Cramschool extends Controller_Api_Base {
    /**
     * GET teacher's related Cramschools
     */
    public function action_get()
    {
        error_log("cramschoool api controllerに来ています");
        $this -> require_teacher();
        $cramschools = Service_Cramschool::getTeachers($this->current_user);
        $this -> json($cramschools);
    }
}