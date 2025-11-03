<?php defined('SYSPATH') or die('No direct script access.');

final class Entity_Teacher extends Entity_User {
    private array $cramSchoolIds;// cramSchools that this user has access to

    public function __construct()
    {
        $this->role = 'teacher';
    }

public static function fromArray($data): Entity_Teacher
{
    error_log("🟦 Entity_Teacher::fromArray 呼び出し: " . json_encode($data, JSON_UNESCAPED_UNICODE));

    $entity = new self();
    $entity->id = $data['id'] ?? null;
    $entity->name = $data['name'] ?? null;
    $entity->cramSchoolIds = isset($data['cramSchoolIds'])
        ? explode(",", $data['cramSchoolIds'])
        : [];

    // 完成したエンティティをログ出力
    error_log("✅ Entity_Teacher 作成完了: " . json_encode([
        'id' => $entity->id,
        'name' => $entity->name,
        'cramSchoolIds' => $entity->cramSchoolIds,
    ], JSON_UNESCAPED_UNICODE));

    return $entity;
}


    public function toArray() :array
    {
        error_log('TO array is called');
        return [
            'id' => $this -> id,
            'role' => 'teacher',
            'name' => $this -> name,
            'cramSchoolIds' => $this -> cramSchoolIds,    
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

    public function getCramSchoolIds(): array
    {
        return $this->cramSchoolIds;
    }
}