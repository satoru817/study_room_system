<?php defined('SYSPATH') or die('No direct script access.');

final class Entity_Studyroom implements JsonSerializable {
    private ?int $study_room_id;
    private string $name;
    private int $room_limit;
    private ?int $current_students;
    
    public static function fromArray($data): self
    {
        $entity = new self();
        $entity->study_room_id = $data['study_room_id'] ?? null;
        $entity->name = $data['name'] ?? '';
        $entity->room_limit = $data['room_limit'] ?? 0;
        $entity->current_students = $data['current_students'] ?? null;
        return $entity;
    }

    public static function fronNameAndRoomLimit(string $name, int $room_limit): self 
    {
        $entity = new self();
        $entity->name = $name;
        $entity->room_limit = $room_limit;
        $entity->current_students = null;
        return $entity;    
    }

    //@Override
    public function jsonSerialize(): array
    {
        return [
            'study_room_id' => $this->study_room_id,
            'name' => $this->name,
            'room_limit' => $this->room_limit,
            'current_students' => $this->current_students
        ];
    }
}
