package org.example.studyroomreservation.studyroom;

import org.example.studyroomreservation.elf.TokyoTimeElf;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class dto {
    public record SolidRegularSchedule(TokyoTimeElf.DayOfWeek dayOfWeek, LocalTime openTime, LocalTime closeTime){}
    public record RegularScheduleBulkSaveRequest(int studyRoomId, List<SolidRegularSchedule> regularSchedules){}
    public record Range(LocalTime openTime, LocalTime closeTime){
        public Range {
            if (openTime.isAfter(closeTime)) {
                throw new IllegalArgumentException();
            }
        }
    }

    public record StudyRoomScheduleExceptionOfOneDate(int studyRoomId, LocalDate date, boolean isOpen, List<Range> schedules, String reason){}
}
