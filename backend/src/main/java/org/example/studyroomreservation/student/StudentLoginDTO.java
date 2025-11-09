package org.example.studyroomreservation.student;

public class StudentLoginDTO {
    private final int studentId;
    private final int el1;
    private final String name;
    private final String furigana;
    private final String cramSchoolName;
    private final String cardId;
    private final String mail;
    private final String lineUserId;
    private final String cramSchoolEmail;
    private final String cramSchoolLineChannelToken;

    //===========================================
    //       INFORMATION FOR LOGIN
    //===========================================
    private final String loginName;

    // BCRYPT ENCODED password
    private final String password;

    //===========================================
    //      　constructor
    //===========================================
    public StudentLoginDTO(
            int studentId,
            int el1,
            String name,
            String furigana,
            String cramSchoolName,
            String cardId,
            String mail,
            String loginName,
            String password,
            String lineUserId,
            String cramSchoolEmail,
            String cramSchoolLineChannelToken
    ) {
        this.studentId = studentId;
        this.el1 = el1;
        this.name = name;
        this.furigana = furigana;
        this.cramSchoolName = cramSchoolName;
        this.cardId = cardId;
        this.mail = mail;
        this.loginName = loginName;
        this.password = password;
        this.lineUserId = lineUserId;
        this.cramSchoolEmail = cramSchoolEmail;
        this.cramSchoolLineChannelToken = cramSchoolLineChannelToken;
    }

    //===========================================
    //       Getters
    //===========================================
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

    public String getCramSchoolName() {
        return cramSchoolName;
    }

    public String getCardId() {
        return cardId;
    }

    public String getMail() {
        return mail;
    }

    public String getLoginName() {
        return loginName;
    }

    public String getPassword() {
        return password;
    }

    public String getLineUserId() { return lineUserId; }
    public String getCramSchoolEmail() { return cramSchoolEmail; }
    public String getCramSchoolLineChannelToken() { return cramSchoolLineChannelToken; }
}

