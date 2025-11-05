package org.example.studyroomreservation.config.security.user;

import org.example.studyroomreservation.student.StudentLoginDTO;

public class StudentUser extends AbstractLoginClient{
    private StudentLoginDTO studentLoginDTO;

    protected StudentUser(StudentLoginDTO studentLoginDTO) {
        super(Authority.ROLE_STUDENT, studentLoginDTO.getPassword(), studentLoginDTO.getLoginName());
        this.studentLoginDTO = studentLoginDTO;
    }
}
