package org.example.studyroomreservation.cramschool;

import org.example.studyroomreservation.config.security.user.TeacherUser;
import org.example.studyroomreservation.entity.CramSchool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
@Service
public class CramSchoolService {
    private static final Logger log = LoggerFactory.getLogger(CramSchoolService.class);
    @Autowired
    private CramSchoolRepository cramSchoolRepository;


    public List<CramSchool> getAllByTeacher(TeacherUser teacher) {
        try {
            return cramSchoolRepository.getAllByUser(teacher.user.getUserId());
        } catch (Exception e) {
            log.error("Error fetching cram schools for teacher {}: {}", teacher, e.getMessage(), e);
            return Collections.emptyList();
        }
    }
}
