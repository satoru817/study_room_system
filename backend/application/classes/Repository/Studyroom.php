<?php defined('SYSPATH') or die('No direct script access.');

final class Repository_Studyroom {

    public static function find_all_by_cramschoolId(int $cramschoolId)
    {
        try {
            $now = date('H:i:s'); 
            $today = date('Y-m-d');

            $query = DB::query(Database::SELECT, "
                SELECT
                    sr.study_room_id,
                    sr.name,
                    sr.room_limit,
                    COALESCE(COUNT(sra.study_room_attendance_id), 0) AS current_students
                FROM study_rooms sr
                LEFT JOIN study_room_reservations srr 
                    ON sr.study_room_id = srr.study_room_id
                    AND srr.date = :today
                LEFT JOIN study_room_attendances sra 
                    ON sra.study_room_reservation_id = srr.study_room_reservation_id
                    AND sra.start_hour <= :now 
                    AND sra.end_hour IS NULL
                WHERE sr.cram_school_id = :cramschool_id
                GROUP BY sr.study_room_id, sr.name, sr.room_limit
            ");

            $query->param(':today', $today);
            $query->param(':now', $now);
            $query->param(':cramschool_id', $cramschoolId);

            $results = $query->execute()->as_array();


            return Elf_Stream::of($results)
                        -> map(fn($r) => Entity_Studyroom::fromArray($r))
                        -> toArray();

        } catch (Database_Exception $e) {
            error_log("❌ find_all_by_cramschoolId DBエラー: " . $e->getMessage());
            return [];
        } catch (Exception $e) {
            error_log("❌ find_all_by_cramschoolId 予期せぬエラー: " . $e->getMessage());
            return [];
        }
    }

    public static function create(int $cramschoolId, string $name, int $room_limit)
    {
        try {
            $result = DB::insert('study_rooms', ['cram_school_id', 'name', 'room_limit'])
                ->values([$cramschoolId, $name, $room_limit])
                ->execute();

            // execute() の返り値は [insert_id, rows_affected] の配列なので Entity に変換できるように配列作成
            return Entity_Studyroom::fromArray([
                'study_room_id' => $result[0], // 挿入されたID
                'name' => $name,
                'room_limit' => $room_limit,
                'current_students' => 0,
            ]);
        } catch (Database_Exception $e) {
            error_log("❌ Repository_Studyroom create DBエラー: " . $e->getMessage());
            return null;
        } catch (Exception $e) {
            error_log("❌ Repository_Studyroom create 予期せぬエラー: " . $e->getMessage());
            return null;
        }
    }

    /**
     * update basic information of a study room
     */
    public static function update(int $study_room_id, string $name, int $room_limit) 
    {
        try {
            DB::update('study_rooms')
                    -> set(array(
                        'name' => $name,
                        'room_limit' => $room_limit
                    ))
                    -> where('study_room_id', '=', $study_room_id)
                    -> execute();

            $updatedStudyRoom = DB::select() -> from('study_rooms') -> where('study_room_id', '=', $study_room_id) -> execute() -> current();
            
            return $updatedStudyRoom;

        }catch (Database_Exception $e) {
            error_log("❌ Repository_Studyroom update DBエラー: " . $e->getMessage());
            return null;
        } catch (Exception $e) {
            error_log("❌ Repository_Studyroom update 予期せぬエラー: " . $e->getMessage());
            return null;
        }
    }

}
