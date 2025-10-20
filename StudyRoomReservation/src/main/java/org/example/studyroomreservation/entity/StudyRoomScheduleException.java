package org.example.studyroomreservation.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "study_room_schedule_exceptions")
public class StudyRoomScheduleException {

    //==============================================================
    //             constructors
    //==============================================================
    protected StudyRoomScheduleException() {
        // for JPA
    }

    private StudyRoomScheduleException(Builder builder) {
        this.date = builder.date;
        this.isOpen = builder.isOpen;
        this.openTime = builder.openTime;
        this.closeTime = builder.closeTime;
        this.reason = builder.reason;
        this.studyRoom = builder.studyRoom;
    }

    //==============================================================
    //             instance fields
    //==============================================================
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer studyRoomScheduleExceptionId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private Boolean isOpen;

    @Column(nullable = false)
    private LocalTime openTime;

    @Column(nullable = false)
    private LocalTime closeTime;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @ManyToOne
    @JoinColumn(name = "study_room_id", nullable = false)
    private StudyRoom studyRoom;

    //==============================================================
    //             getters
    //==============================================================
    public Integer getStudyRoomScheduleExceptionId() {
        return studyRoomScheduleExceptionId;
    }

    public LocalDate getDate() {
        return date;
    }

    public Boolean getIsOpen() {
        return isOpen;
    }

    public LocalTime getOpenTime() {
        return openTime;
    }

    public LocalTime getCloseTime() {
        return closeTime;
    }

    public String getReason() {
        return reason;
    }

    public StudyRoom getStudyRoom() {
        return studyRoom;
    }

    //==============================================================
    //             builder
    //==============================================================
    public static class Builder {
        private LocalDate date;
        private Boolean isOpen;
        private LocalTime openTime;
        private LocalTime closeTime;
        private String reason;
        private StudyRoom studyRoom;

        public Builder date(LocalDate date) {
            this.date = date;
            return this;
        }

        public Builder isOpen(Boolean isOpen) {
            this.isOpen = isOpen;
            return this;
        }

        public Builder openTime(LocalTime openTime) {
            this.openTime = openTime;
            return this;
        }

        public Builder closeTime(LocalTime closeTime) {
            this.closeTime = closeTime;
            return this;
        }

        public Builder reason(String reason) {
            this.reason = reason;
            return this;
        }

        public Builder studyRoom(StudyRoom studyRoom) {
            this.studyRoom = studyRoom;
            return this;
        }

        public StudyRoomScheduleException build() {
            if (date == null)
                throw new IllegalArgumentException("date must not be null");
            if (isOpen == null)
                throw new IllegalArgumentException("isOpen must not be null");
            if (openTime == null)
                throw new IllegalArgumentException("openTime must not be null");
            if (closeTime == null)
                throw new IllegalArgumentException("closeTime must not be null");
            if (studyRoom == null)
                throw new IllegalArgumentException("studyRoom must not be null");
            if (openTime.isAfter(closeTime))
                throw new IllegalArgumentException("openTime must not be after closeTime");

            return new StudyRoomScheduleException(this);
        }
    }
}
