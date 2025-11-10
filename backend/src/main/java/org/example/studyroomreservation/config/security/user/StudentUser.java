package org.example.studyroomreservation.config.security.user;

import org.example.studyroomreservation.student.StudentLoginDTO;

public class StudentUser extends AbstractLoginClient{
    private StudentLoginDTO studentLoginDTO;

    protected StudentUser(StudentLoginDTO studentLoginDTO) {
        super(Authority.ROLE_STUDENT, studentLoginDTO.getPassword(), studentLoginDTO.getLoginName(), studentLoginDTO.getStudentId());
        this.studentLoginDTO = studentLoginDTO;
    }

    public int getStudentId() {
        return studentLoginDTO.getStudentId();
    }
    public String getStudentEmail() { return studentLoginDTO.getMail(); }
    public String getCramSchoolEmail() { return studentLoginDTO.getCramSchoolEmail(); }
    public String getLineUserId() { return studentLoginDTO.getLineUserId(); }
    public String getCramSchoolLineChannelToken() { return studentLoginDTO.getCramSchoolLineChannelToken(); }
    public String getCramSchoolName() {
        return studentLoginDTO.getCramSchoolName();
    }
    public String getStudentName() { return studentLoginDTO.getName(); }
}
