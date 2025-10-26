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
    day_of_week INT NOT NULL,
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

