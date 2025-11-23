package org.example.studyroomreservation.studyroom;

import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.example.studyroomreservation.notification.DTO;

import java.io.Serializable;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class dto {
    public interface IRange {
        LocalTime openTime();
        LocalTime closeTime();
    }
    public record SolidRegularSchedule(DayOfWeek dayOfWeek, LocalTime openTime, LocalTime closeTime){}
    public record RegularScheduleBulkSaveRequest(int studyRoomId, List<SolidRegularSchedule> regularSchedules){}
    public record Range(LocalTime openTime, LocalTime closeTime) implements Serializable, IRange {
        public Range {
            if (openTime.isAfter(closeTime)) {
                throw new IllegalArgumentException();
            }
        }
        public Range adjust(LocalTime startHour, LocalTime endHour) {
            if (closeTime.isBefore(startHour) || openTime.isAfter(endHour)) return null;
            var _openTime = openTime.isAfter(startHour) ? openTime : startHour;
            var _closeTime = closeTime.isBefore(endHour) ? closeTime : endHour;
            if (_openTime.equals(_closeTime)) return null;
            return new Range(
                    _openTime, _closeTime
            );
        }
    }

    public record StudyRoomScheduleExceptionOfOneDate(int studyRoomId, LocalDate date, boolean isOpen, List<Range> schedules, String reason){}

    public record StudyRoomScheduleExceptionDeleteRequest(int studyRoomId, LocalDate date){}

    public record StudyRoomShowResponseForStudent(int studyRoomId, String name){}

    public record WeeklyAvailabilityResponse(
            int studyRoomId,
            LocalDate weekStartDate, // この週の開始日（月曜日とか）
            List<DailyAvailability> dailyAvailabilities
    ) {}

    public record DailyAvailability(LocalDate date,
                                    String dayOfWeek, // "月", "火", etc.
                                    boolean isBookable, // 過去の日付ならfalse
                                    List<TimeSlotAvailability> timeSlots) implements Comparable<DailyAvailability>

    {

        @Override
        public int compareTo(DailyAvailability availability) {
            return date.compareTo(availability.date);
        }
    }

    public record TimeSlotAvailability(
            LocalDate date,
            LocalTime startTime, // 例: 07:00
            LocalTime endTime,   // 例: 07:15
            int availableSeats,  // 空き席数
            int totalSeats,      // 定員
            boolean isOpen,       // この時間帯に開室してるか
            boolean isBookedByThisStudentThisRoom,
            boolean isBookedByThisStudentOtherRoom
    ) {}

    public record CreateReservationRequest(
            int studyRoomId,
            int offset,
            List<ReservationSlot> reservations
    ) {
        public LocalDate getWeekStart() {
            return TokyoTimeElf.getThisWeekMonday().plusWeeks((long)offset);
        }

        public LocalDate getWeekEnd() {
            return TokyoTimeElf.getThisWeekSunday().plusWeeks((long) offset);
        }
    }

    public record ReservationSlot(
            LocalDate date,
            LocalTime startHour,
            LocalTime endHour
    ) {}

    public record ScheduleSlot(
            LocalDate date,
            LocalTime openTime,
            LocalTime closeTime
    ) implements IRange {
    }

    public record StudyRoomShow(
            int studyRoomId,
            String studyRoomName,
            String cramSchoolName
    ){}

    public record CopyRegularScheduleRequest(
            int fromStudyRoomId,
            List<Integer> toStudyRoomIds
    ) {}

    public record CopyScheduleExceptionRequest(
            int fromStudyRoomId,
            List<Integer> toStudyRoomIds,
            int year,
            int month
    ) {}
    public record RegularScheduleUpdatedResponse(List<dto.StudyRoomRegularScheduleDTO> updatedRegularSchedule, DTO.NotificationResult notificationResult){}

    public record StudyRoomRegularScheduleDTO(
            int studyRoomId,
            DayOfWeek dayOfWeek,
            LocalTime openTime,
            LocalTime closeTime){
        public Range getRange() {
            return new Range(openTime, closeTime);
        }
    }
}
