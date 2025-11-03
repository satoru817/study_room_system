<?php defined('SYSPATH') or die('No direct script access.');

final class Entity_Student extends Entity_User {
    private int $el1;
    private string $CramschoolName;
    private string $CramschoolEmail;
    private string $studentEmail;
    private string $CramschoolLineChannelToken;
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
        $entity -> CramschoolName = $data['CramschoolName'];
        $entity -> CramschoolEmail = $data['CramschoolEmail'];
        $entity -> studentEmail = $data['studentEmail'];
        $entity -> CramschoolLineChannelToken = $data['lineChannelToken'];
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
            'CramschoolName' => $this -> CramschoolName,
            'CramschoolEmail' => $this -> CramschoolEmail,
            'studentEmail' => $this -> studentEmail,
            'CramschoolLineChannelToken' => $this -> CramschoolLineChannelToken,
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

    public function getCramschoolName(): string
    {
        return $this->CramschoolName;
    }

    public function getCramschoolEmail(): string
    {
        return $this->CramschoolEmail;
    }

    public function getCramschoolLineChannelToken(): string
    {
        return $this->CramschoolLineChannelToken;
    }

    public function getLineUserId(): string
    {
        return $this->lineUserId;
    }
    
}