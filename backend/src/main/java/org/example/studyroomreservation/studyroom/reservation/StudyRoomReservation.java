package org.example.studyroomreservation.studyroom.reservation;

import jakarta.persistence.*;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.example.studyroomreservation.student.Student;
import org.example.studyroomreservation.studyroom.StudyRoom;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "study_room_reservations")
public class StudyRoomReservation {

    //==============================================================
    //             constructors
    //==============================================================
    protected StudyRoomReservation() {
        // for JPA
    }

    private StudyRoomReservation(Builder builder) {
        this.date = builder.date;
        this.startHour = builder.startHour;
        this.endHour = builder.endHour;
        this.studyRoom = builder.studyRoom;
        this.student = builder.student;
    }

    //==============================================================
    //             instance fields
    //==============================================================
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int studyRoomReservationId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalTime startHour;

    @Column(nullable = false)
    private LocalTime endHour;

    @JoinColumn(name = "study_room_id", nullable = false)
    @ManyToOne
    private StudyRoom studyRoom;

    @JoinColumn(name = "student_id", nullable = false)
    @ManyToOne
    private Student student;

    //==============================================================
    //             getters
    //==============================================================
    public int getStudyRoomReservationId() {
        return studyRoomReservationId;
    }

    public LocalDate getDate() {
        return date;
    }

    public LocalTime getStartHour() {
        return startHour;
    }

    public LocalTime getEndHour() {
        return endHour;
    }

    public StudyRoom getStudyRoom() {
        return studyRoom;
    }

    public Student getStudent() {
        return student;
    }

    //==============================================================
    //             builder
    //==============================================================
    public static class Builder {
        private LocalDate date;
        private LocalTime startHour;
        private LocalTime endHour;
        private StudyRoom studyRoom;
        private Student student;

        public Builder date(LocalDate date) {
            this.date = date;
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

        public Builder studyRoom(StudyRoom studyRoom) {
            this.studyRoom = studyRoom;
            return this;
        }

        public Builder student(Student student) {
            this.student = student;
            return this;
        }

        public StudyRoomReservation build() {
            // --- Validation ---
            if (date == null) throw new IllegalArgumentException("date must not be null");
            if (startHour == null) throw new IllegalArgumentException("startHour must not be null");
            if (endHour == null) throw new IllegalArgumentException("endHour must not be null");
            if (studyRoom == null) throw new IllegalArgumentException("studyRoom must not be null");
            if (student == null) throw new IllegalArgumentException("student must not be null");
            if (startHour.isAfter(endHour))
                throw new IllegalArgumentException("startHour must not be after endHour");
            if (startHour.equals(endHour))
                throw new IllegalArgumentException("startHour and endHour must not be the same");
            if (date.isBefore(TokyoTimeElf.getTokyoLocalDate()))
                throw new IllegalArgumentException("Reservation date must not be in the past");

            return new StudyRoomReservation(this);
        }
    }
}
