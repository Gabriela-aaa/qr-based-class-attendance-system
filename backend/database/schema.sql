-- Advanced Attendance System (MySQL) schema
-- Based on doc Table 2.3 data dictionary + role hierarchy described in design section.
--
-- Not in your doc (suggestion) fields are kept minimal and are marked inline where added.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS advanced_attendance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE advanced_attendance;

-- Core users table (User object)
CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','instructor','admin') NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB;

-- Student subtype (Student object)
CREATE TABLE IF NOT EXISTS students (
  student_id VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  department VARCHAR(150) NOT NULL,
  year INT NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (student_id),
  UNIQUE KEY uq_students_user_id (user_id),
  CONSTRAINT fk_students_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Instructor subtype (Instructor object)
CREATE TABLE IF NOT EXISTS instructors (
  instructor_id VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  department VARCHAR(150) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (instructor_id),
  UNIQUE KEY uq_instructors_user_id (user_id),
  CONSTRAINT fk_instructors_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Administrator subtype (Administrator object)
CREATE TABLE IF NOT EXISTS administrators (
  admin_id VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (admin_id),
  UNIQUE KEY uq_admins_user_id (user_id),
  CONSTRAINT fk_admins_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Course object
CREATE TABLE IF NOT EXISTS courses (
  course_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_code VARCHAR(50) NOT NULL,
  course_name VARCHAR(200) NOT NULL,
  department VARCHAR(150) NOT NULL,
  credit_hour INT NOT NULL,
  instructor_id VARCHAR(50) NULL,
  -- Not in your doc (suggestion): eligibility threshold per course (you have a use case for it)
  eligibility_percentage INT NULL,
  PRIMARY KEY (course_id),
  UNIQUE KEY uq_courses_course_code (course_code),
  KEY idx_courses_instructor_id (instructor_id),
  CONSTRAINT fk_courses_instructor
    FOREIGN KEY (instructor_id) REFERENCES instructors(instructor_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ClassSession object
CREATE TABLE IF NOT EXISTS class_sessions (
  session_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id BIGINT UNSIGNED NOT NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NULL,
  status ENUM('open','closed') NOT NULL DEFAULT 'open',
  -- Not in your doc (suggestion): store session QR + expected GPS
  qr_code TEXT NULL,
  gps_location VARCHAR(255) NULL,
  PRIMARY KEY (session_id),
  KEY idx_sessions_course_id (course_id),
  CONSTRAINT fk_sessions_course
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Attendance object
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id VARCHAR(50) NOT NULL,
  session_id BIGINT UNSIGNED NOT NULL,
  marked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('present','absent') NOT NULL DEFAULT 'present',
  -- Not in your doc (suggestion): evidence stored per record
  qr_code TEXT NULL,
  gps_location VARCHAR(255) NULL,
  PRIMARY KEY (attendance_id),
  UNIQUE KEY uq_attendance_student_session (student_id, session_id),
  KEY idx_attendance_session_id (session_id),
  CONSTRAINT fk_attendance_student
    FOREIGN KEY (student_id) REFERENCES students(student_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_attendance_session
    FOREIGN KEY (session_id) REFERENCES class_sessions(session_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ActivityLog object
CREATE TABLE IF NOT EXISTS activity_logs (
  log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  activity_type VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Not in your doc (suggestion): actor + metadata for audit trail
  user_id BIGINT UNSIGNED NULL,
  metadata JSON NULL,
  PRIMARY KEY (log_id),
  KEY idx_logs_user_id (user_id),
  CONSTRAINT fk_logs_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Report object
CREATE TABLE IF NOT EXISTS reports (
  report_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_type VARCHAR(100) NOT NULL,
  generated_by VARCHAR(200) NOT NULL,
  generated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Not in your doc (suggestion): link for traceability
  course_id BIGINT UNSIGNED NULL,
  session_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (report_id),
  KEY idx_reports_course_id (course_id),
  KEY idx_reports_session_id (session_id),
  CONSTRAINT fk_reports_course
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_reports_session
    FOREIGN KEY (session_id) REFERENCES class_sessions(session_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Notification object
CREATE TABLE IF NOT EXISTS notifications (
  notification_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  message TEXT NOT NULL,
  recipient_id BIGINT UNSIGNED NOT NULL,
  sent_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id),
  KEY idx_notifications_recipient_id (recipient_id),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (recipient_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

