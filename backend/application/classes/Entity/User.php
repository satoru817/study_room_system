<?php defined('SYSPATH') or die('No direct script access');

abstract class Entity_User {
    protected int $id;// this is studentId or userId
    protected string $role;
    protected string $name;// teacher's email address or student's loginname

    public function isStudent() {
        return $this->role === 'student';
    }

    public function isTeacher() {
        return $this->role === 'teacher';
    }

    public function getId() {
        return $this::$id;
    }

    public function getName() {
        return $this::$name;
    }

    public function getRole(): string {
        return $this::$role;
    }

    abstract public function toArray():array;
}   
