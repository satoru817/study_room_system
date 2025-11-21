CREATE TABLE IF NOT EXISTS student_login_infos (
    student_login_info_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    login_name VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    student_id INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_rooms (
    study_room_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    cram_school_id INT NOT NULL,
    name VARCHAR(255) UNIQUE,
    room_limit INT NOT NULL,
    FOREIGN KEY (cram_school_id) REFERENCES cram_schools(cram_school_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_room_reservations (
    study_room_reservation_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    start_hour TIME NOT NULL,
    end_hour TIME NOT NULL,
    study_room_id INT NOT NULL,
    student_id INT NOT NULL,
    FOREIGN KEY (study_room_id) REFERENCES study_rooms(study_room_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_room_regular_schedules (
    study_room_regular_schedule_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    day_of_week VARCHAR(20) NOT NULL,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    study_room_id INT NOT NULL,
    FOREIGN KEY (study_room_id) REFERENCES study_rooms(study_room_id) ON DELETE CASCADE
--     UNIQUE KEY (day_of_week, study_room_id) I don't think I have to delete this... but just in case...
);

CREATE TABLE IF NOT EXISTS study_room_schedule_exceptions (
    study_room_schedule_exception_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    is_open BOOLEAN NOT NULL,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    reason TEXT,
    study_room_id INT NOT NULL,
    FOREIGN KEY(study_room_id) REFERENCES study_rooms(study_room_id) ON DELETE CASCADE
--     UNIQUE KEY (date, study_room_id) the same as above. maybe i could add this line...
);

CREATE TABLE IF NOT EXISTS student_login_infos (
    student_login_info_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    login_name VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    student_id INT NOT NULL UNIQUE,
    FOREIGN KEY student_id REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_tokens (
    student_token_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(255) NOT NULL UNIQUE,
    student_id INT NOT NULL,
    user_id INT NOT NULL,  -- 発行者（教師）を記録?
    valid_until DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY(student_id)
);

CREATE TABLE IF NOT EXISTS study_room_attendances (
    study_room_attendance_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    start_hour TIME,
    end_hour TIME,
    study_room_reservation_id INT NOT NULL,
    FOREIGN KEY (study_room_reservation_id) REFERENCES study_room_reservations(study_room_reservation_id) ON DELETE CASCADE
);

CREATE TABLE time_slots (
    slot_id TINYINT PRIMARY KEY,
    start_time TIME NOT NULL,
    end_time   TIME NOT NULL
);

INSERT INTO time_slots (slot_id, start_time, end_time)
VALUES
( 0,'07:00','07:15'),
( 1,'07:15','07:30'),
( 2,'07:30','07:45'),
( 3,'07:45','08:00'),
( 4,'08:00','08:15'),
( 5,'08:15','08:30'),
( 6,'08:30','08:45'),
( 7,'08:45','09:00'),
( 8,'09:00','09:15'),
( 9,'09:15','09:30'),
(10,'09:30','09:45'),
(11,'09:45','10:00'),
(12,'10:00','10:15'),
(13,'10:15','10:30'),
(14,'10:30','10:45'),
(15,'10:45','11:00'),
(16,'11:00','11:15'),
(17,'11:15','11:30'),
(18,'11:30','11:45'),
(19,'11:45','12:00'),
(20,'12:00','12:15'),
(21,'12:15','12:30'),
(22,'12:30','12:45'),
(23,'12:45','13:00'),
(24,'13:00','13:15'),
(25,'13:15','13:30'),
(26,'13:30','13:45'),
(27,'13:45','14:00'),
(28,'14:00','14:15'),
(29,'14:15','14:30'),
(30,'14:30','14:45'),
(31,'14:45','15:00'),
(32,'15:00','15:15'),
(33,'15:15','15:30'),
(34,'15:30','15:45'),
(35,'15:45','16:00'),
(36,'16:00','16:15'),
(37,'16:15','16:30'),
(38,'16:30','16:45'),
(39,'16:45','17:00'),
(40,'17:00','17:15'),
(41,'17:15','17:30'),
(42,'17:30','17:45'),
(43,'17:45','18:00'),
(44,'18:00','18:15'),
(45,'18:15','18:30'),
(46,'18:30','18:45'),
(47,'18:45','19:00'),
(48,'19:00','19:15'),
(49,'19:15','19:30'),
(50,'19:30','19:45'),
(51,'19:45','20:00'),
(52,'20:00','20:15'),
(53,'20:15','20:30'),
(54,'20:30','20:45'),
(55,'20:45','21:00'),
(56,'21:00','21:15'),
(57,'21:15','21:30'),
(58,'21:30','21:45'),
(59,'21:45','22:00'),
(60,'22:00','22:15'),
(61,'22:15','22:30'),
(62,'22:30','22:45'),
(63,'22:45','23:00'),
(64,'23:00','23:15'),
(65,'23:15','23:30'),
(66,'23:30','23:45');

-- 2) seq_0_to_6 テーブル（0..6）
CREATE TABLE IF NOT EXISTS seq_0_to_6 (
  seq TINYINT UNSIGNED NOT NULL PRIMARY KEY
);

-- 既に入っていなければ挿入（重複エラー回避のため INSERT IGNORE）
INSERT IGNORE INTO seq_0_to_6 (seq) VALUES
(0),(1),(2),(3),(4),(5),(6);