package org.example.studyroomreservation.studyroom;

import jakarta.persistence.*;
import org.example.studyroomreservation.elf.TokyoTimeElf;

import java.time.LocalTime;

@Entity
@Table(name = "study_room_regular_schedules")
public class StudyRoomRegularSchedule {

    protected StudyRoomRegularSchedule() {
        //　jpa default constructor
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int studyRoomRegularScheduleId;

    @Enumerated(EnumType.STRING)
    private TokyoTimeElf.DayOfWeek dayOfWeek;

    private LocalTime openTime;

    private LocalTime closeTime;

    @JoinColumn(name = "study_room_id")
    @ManyToOne(optional = false)
    private StudyRoom studyRoom;

    // ---- Getter ----
    public int getStudyRoomRegularScheduleId() {
        return studyRoomRegularScheduleId;
    }

    public TokyoTimeElf.DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public LocalTime getOpenTime() {
        return openTime;
    }

    public LocalTime getCloseTime() {
        return closeTime;
    }

    public StudyRoom getStudyRoom() {
        return studyRoom;
    }

    // ---- Builder ----
    public static class Builder {
        private TokyoTimeElf.DayOfWeek dayOfWeek;
        private LocalTime openTime;
        private LocalTime closeTime;
        private StudyRoom studyRoom;

        public Builder dayOfWeek(TokyoTimeElf.DayOfWeek dayOfWeek) {
            this.dayOfWeek = dayOfWeek;
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

        public Builder studyRoom(StudyRoom studyRoom) {
            this.studyRoom = studyRoom;
            return this;
        }

        public StudyRoomRegularSchedule build() {
            if (dayOfWeek == null || openTime == null || closeTime == null || studyRoom == null) {
                throw new IllegalStateException("必須フィールドが未設定です");
            }

            StudyRoomRegularSchedule schedule = new StudyRoomRegularSchedule();
            schedule.dayOfWeek = this.dayOfWeek;
            schedule.openTime = this.openTime;
            schedule.closeTime = this.closeTime;
            schedule.studyRoom = this.studyRoom;
            return schedule;
        }
    }

    public void setDayOfWeek(TokyoTimeElf.DayOfWeek dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public void setOpenTime(LocalTime openTime) {
        this.openTime = openTime;
    }

    public void setCloseTime(LocalTime closeTime) {
        this.closeTime = closeTime;
    }

    public void setStudyRoom(StudyRoom studyRoom) {
        this.studyRoom = studyRoom;
    }

}
