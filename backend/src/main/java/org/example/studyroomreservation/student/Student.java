package org.example.studyroomreservation.student;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.example.studyroomreservation.cramschool.CramSchool;

import java.time.LocalDate;

@Entity
@Table(name = "students")
public class Student {
    @JsonIgnore
    public static final int GRADE_CHANGE_MONTH = 3;
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

    //==============================================================
    //               SETTERS
    //=============================================================
    public void setMail(String mail) {
        this.mail = mail;
    }

    //===========================================================================
    //           INSTANCE METHODS
    //===========================================================================

    public String getGradeStr() {
        return getGradeStr(this.el1);
    }

    @JsonIgnore
    public static String getGradeStr(int el1) {
        LocalDate now = TokyoTimeElf.getTokyoLocalDate();

        int grade= (now.getMonthValue() >= GRADE_CHANGE_MONTH) ? now.getYear() - el1 + 1 : now.getYear();

        return switch (grade) {
            case 1, 2, 3, 4, 5, 6 -> "小学" + grade + "年";
            case 7, 8, 9 -> "中学" + (grade - 6) + "年";
            case 10, 11, 12 -> "高校" + (grade - 9) + "年";
            default -> "卒業";
        };
    }

}
