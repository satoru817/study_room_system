package org.example.studyroomreservation.studyroom.attendance;

import jakarta.persistence.*;
import org.example.studyroomreservation.studyroom.reservation.StudyRoomReservation;

import java.time.LocalTime;

@Entity
@Table(name = "study_room_attendances")
public class StudyRoomAttendance {

    protected StudyRoomAttendance() {
        // for JPA
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int studyRoomAttendanceId;

    @JoinColumn(name = "study_room_reservation_id")
    @OneToOne
    private StudyRoomReservation studyRoomReservation;

    private LocalTime startHour;
    private LocalTime endHour;

    // --- Getter ---
    public int getStudyRoomAttendanceId() {
        return studyRoomAttendanceId;
    }

    public StudyRoomReservation getStudyRoomReservation() {
        return studyRoomReservation;
    }

    public LocalTime getStartHour() {
        return startHour;
    }

    public LocalTime getEndHour() {
        return endHour;
    }

    // --- Setter ---
    public void setStudyRoomAttendanceId(int studyRoomAttendanceId) {
        this.studyRoomAttendanceId = studyRoomAttendanceId;
    }

    public void setStudyRoomReservation(StudyRoomReservation studyRoomReservation) {
        this.studyRoomReservation = studyRoomReservation;
    }

    public void setStartHour(LocalTime startHour) {
        this.startHour = startHour;
    }

    public void setEndHour(LocalTime endHour) {
        this.endHour = endHour;
    }

    // --- Builder ---
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private StudyRoomReservation studyRoomReservation;
        private LocalTime startHour;
        private LocalTime endHour;

        public Builder studyRoomReservation(StudyRoomReservation studyRoomReservation) {
            this.studyRoomReservation = studyRoomReservation;
            return this;
        }

        public Builder startHour(LocalTime startHour) {
            this.startHour = startHour;
            return this;
        }

        public Builder endHour(LocalTime endHour) {
            this.endHour = endHour;
            return this;
        }

        public StudyRoomAttendance build() {
            if (studyRoomReservation == null) {
                throw new IllegalStateException("studyRoomReservation は必須です");
            }

            StudyRoomAttendance attendance = new StudyRoomAttendance();
            attendance.studyRoomReservation = this.studyRoomReservation;
            attendance.startHour = this.startHour;
            attendance.endHour = this.endHour;
            return attendance;
        }
    }
}
