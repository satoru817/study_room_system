package org.example.studyroomreservation.student;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.example.studyroomreservation.elf.TokyoTimeElf;

import java.time.LocalDate;

public record StudentStatus(
        int studentId,
        String name,
        @JsonIgnore int el1,
        String mail,
        boolean shouldBeAttending,
        boolean isAttending,
        boolean isRegistered
) {

    public String getGradeStr() {
        return Student.getAbsoluteGrade(this.el1);
    }

    public boolean isValid() {
        return !(shouldBeAttending && !isAttending);
    }
}
