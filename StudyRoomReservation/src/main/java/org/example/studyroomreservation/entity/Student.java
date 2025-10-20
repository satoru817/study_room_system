package org.example.studyroomreservation.entity;

import jakarta.persistence.*;
import org.example.studyroomreservation.elf.TokyoTimeElf;

import java.time.LocalDate;

@Entity
@Table(name = "students")
public class Student {
    //============================================================================
    //                FIELDS
    //============================================================================
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int studentId;

    @Column
    private int el1;

    @Column
    private String name;

    @Column
    private String furigana;

    @JoinColumn(name = "cram_school_id")
    @ManyToOne
    private CramSchool cramSchool;

    @Column
    private String mail;

    @Column
    private String cardId; // this might be unnecessary

    //===========================================================================
    //           GETTERS
    //===========================================================================
    public int getStudentId() {
        return studentId;
    }

    public int getEl1() {
        return el1;
    }

    public String getName() {
        return name;
    }

    public String getFurigana() {
        return furigana;
    }

    public CramSchool getCramSchool() {
        return cramSchool;
    }

    public String getMail() {
        return mail;
    }

    public String getCardId() {
        return cardId;
    }

    //===========================================================================
    //           INSTANCE METHODS
    //===========================================================================
    public int getAbsoluteGrade() {
        LocalDate now = TokyoTimeElf.getTokyoLocalDate();
        int grade;
        if (now.getMonthValue() >= 3) {
            grade = now.getYear() - el1 + 1;
        } else {
            grade = now.getYear() - el1;
        }
        return grade;
    }

    public String getGradeStr() {
        int grade = this.getAbsoluteGrade();

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
}
