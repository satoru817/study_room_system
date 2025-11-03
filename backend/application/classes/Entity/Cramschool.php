<?php defined('SYSPATH') or die('No direct script access.');

final class Entity_Cramschool implements JsonSerializable {
    private int $cramschoolId;
    private string $name;

    public static function fromArray($data): Entity_Cramschool
    {
        $entity = new self();
        $entity->cramschoolId = $data['cramschoolId'];
        $entity->name = $data['name'];
        return $entity;
    }

    public function jsonSerialize(): array {
        return [
            'cramschoolId' => $this->cramschoolId,
            'name' => $this->name
        ];
    }
}