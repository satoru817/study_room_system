<?php defined('SYSPATH') or die('No direct script access.');

final class Entity_Student extends Entity_User {
    private int $el1;
    private string $cramSchoolName;
    private string $cramSchoolEmail;
    private string $studentEmail;
    private string $cramSchoolLineChannelToken;
    private string $lineUserId;


    public function __construct()
    {
        $this->role = 'student';
    }

    public static function fromArray($data):Entity_Student
    {
        $entity = new self();
        $entity->id = $data['id'];
        $entity->name = $data['name'];
        $entity -> el1 = $data['el1'];
        $entity -> cramSchoolName = $data['cramSchoolName'];
        $entity -> cramSchoolEmail = $data['cramSchoolEmail'];
        $entity -> studentEmail = $data['studentEmail'];
        $entity -> cramSchoolLineChannelToken = $data['lineChannelToken'];
        $entity -> lineUserId = $data['lineUserId'];
        return $entity;
    }

    public function toArray() :array
    {
        return [
            'id' => $this -> id,
            'role' => 'student',
            'name' => $this -> name,
            'el1' => $this -> el1,
            'cramSchoolName' => $this -> cramSchoolName,
            'cramSchoolEmail' => $this -> cramSchoolEmail,
            'studentEmail' => $this -> studentEmail,
            'cramSchoolLineChannelToken' => $this -> cramSchoolLineChannelToken,
            'lineUserId' => $this -> lineUserId,
        ];
    }

    // ---------------------------------------
    //          Getter methods
    // ---------------------------------------

    public function getEl1(): int
    {
        return $this->el1;
    }

    public function getCramSchoolName(): string
    {
        return $this->cramSchoolName;
    }

    public function getCramSchoolEmail(): string
    {
        return $this->cramSchoolEmail;
    }

    public function getCramSchoolLineChannelToken(): string
    {
        return $this->cramSchoolLineChannelToken;
    }

    public function getLineUserId(): string
    {
        return $this->lineUserId;
    }
    
}