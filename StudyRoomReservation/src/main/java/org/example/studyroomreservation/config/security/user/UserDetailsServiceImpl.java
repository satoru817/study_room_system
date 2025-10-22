package org.example.studyroomreservation.config.security.user;

import org.example.studyroomreservation.dto.StudentLoginDTO;
import org.example.studyroomreservation.entity.User;
import org.example.studyroomreservation.student.StudentRepository;
import org.example.studyroomreservation.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        //  first look at student table
        StudentLoginDTO loginDTO = studentRepository.getStudentLoginDTOByLoginName(username);
        if (loginDTO != null) {
            return new UserDetailsImpl(new StudentUser(loginDTO));
        }

        // then look at user table(teacher)
        User user = userRepository.getByEmail(username);
        if (user != null) {
            return new UserDetailsImpl(new TeacherUser(user));
        }

        throw new UsernameNotFoundException("User not found: " + username);
    }
}