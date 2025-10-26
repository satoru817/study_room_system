package org.example.studyroomreservation.student;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.example.studyroomreservation.elf.TokyoTimeElf;

import java.time.LocalDate;

public record StudentStatus(
        String name,
        @JsonIgnore int el1,
        String mail,
        boolean shouldBeAttending,
        boolean isAttending,
        boolean isRegistered
) {
    private static final int GRADE_CHANGE_MONTH = 3;

    @JsonIgnore
    public int getAbsoluteGrade() {
        LocalDate now = TokyoTimeElf.getTokyoLocalDate();
        int grade;
        if (now.getMonthValue() >= GRADE_CHANGE_MONTH) {
            grade = now.getYear() - el1 + 1;
        } else {
            grade = now.getYear() - el1;
        }
        return grade;
    }

    public String getGradeStr() {
        int grade = getAbsoluteGrade();
        if (grade <= 6) {
            return "小学" + grade + "年";
        } else if (grade <= 9) {
            return "中学" + (grade - 6) + "年";
        } else if (grade <= 12) {
            return "高校" + (grade - 9) + "年";
        } else {
            return "卒業";
        }
    }

    public boolean isValid() {
        return !(shouldBeAttending && !isAttending);
    }
}
