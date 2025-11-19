package org.example.studyroomreservation.elf;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;

public class TokyoTimeElf {
    private static final int UNIVERSITY_EXAM_FINISH_MONTH = 3;
    private static final ZoneId TOKYO_ZONE_ID = ZoneId.of("Asia/Tokyo");

    public static LocalDate getTokyoLocalDate(){
        return LocalDate.now(TOKYO_ZONE_ID);
    }

    public static LocalDateTime getTokyoLocalDateTime(){
        return LocalDateTime.now(TOKYO_ZONE_ID);
    }

    public static LocalDate getThisWeekMonday() {
        LocalDate today = getTokyoLocalDate();
       return today.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
    }

    public static LocalDate getThisWeekSunday() {
        LocalDate today = getTokyoLocalDate();
        return today.with(TemporalAdjusters.nextOrSame(java.time.DayOfWeek.SUNDAY));
    }
    /**
     * Calculates the earliest possible EL1 year for a student who is still enrolled.
     * Students remain enrolled through March (university entrance exams finish in March),
     * and they are considered graduated starting in April.
     */
    public static int getMinEl1() {
        LocalDate now = getTokyoLocalDate();
        int month = now.getMonthValue();
        int year = now.getYear();
        return month > UNIVERSITY_EXAM_FINISH_MONTH ? year - 11 : year - 12;
    }

    public static enum DayOfWeek {
        monday, tuesday, wednesday, thursday, friday, saturday, sunday
    }

    public static DayOfWeek convert(java.time.DayOfWeek dayOfWeek) {
        return switch(dayOfWeek) {
            case SUNDAY -> DayOfWeek.sunday;
            case MONDAY -> DayOfWeek.monday;
            case TUESDAY -> DayOfWeek.tuesday;
            case WEDNESDAY -> DayOfWeek.wednesday;
            case THURSDAY -> DayOfWeek.thursday;
            case FRIDAY -> DayOfWeek.friday;
            case SATURDAY -> DayOfWeek.saturday;
        };
    }

    public static String getFormattedTime() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy年MM月dd日 HH時mm分");
        return getTokyoLocalDateTime().format(formatter);
    }
}
