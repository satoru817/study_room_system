<?php defined('SYSPATH') or die('No direct script access.');

final class Entity_Teacher extends Entity_User {
    private array $cramschoolIds;// Cramschools that this user has access to

    public function __construct()
    {
        $this->role = 'teacher';
    }

    public static function fromArray($data):Entity_Teacher
    {
        error_log("from array is called");
        $entity = new self();
        $entity->id = $data['id'];
        $entity->name = $data['name'];
        $entity->cramschoolIds = explode(",", $data['cramschoolIds']);
        return $entity;
    }

    public static function fromArrayOfArray($data):Entity_Teacher
    {
        error_log("from array is called!");
        $entity = new self();
        $entity->id = $data['id'];
        $entity->name = $data['name'];
        $entity->cramschoolIds = $data['cramschoolIds'];
        return $entity;
    }

    public function toArray() :array
    {
        error_log('TO array is called');
        return [
            'id' => $this -> id,
            'role' => 'teacher',
            'name' => $this -> name,
            'cramschoolIds' => $this -> cramschoolIds,    
        ];
    }

    // ---------------------------------------
    //            Getter methods
    // ---------------------------------------

    public function getId(): int
    {
        return $this->id;
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getCramschoolIds(): array
    {
        return $this->cramschoolIds;
    }
}