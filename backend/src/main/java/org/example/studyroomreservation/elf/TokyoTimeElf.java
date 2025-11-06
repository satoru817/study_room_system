package org.example.studyroomreservation.elf;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

public class TokyoTimeElf {
    private static final ZoneId TOKYO_ZONE_ID = ZoneId.of("Asia/Tokyo");

    public static LocalDate getTokyoLocalDate(){
        return LocalDate.now(TOKYO_ZONE_ID);
    }

    public static LocalDateTime getTokyoLocalDateTime(){
        return LocalDateTime.now(TOKYO_ZONE_ID);
    }


    public static enum DayOfWeek {
        monday, tuesday, wednesday, thursday, friday, saturday, sunday
    }
}
