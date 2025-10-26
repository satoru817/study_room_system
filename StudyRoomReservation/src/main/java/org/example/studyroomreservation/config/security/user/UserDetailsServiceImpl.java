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

import java.util.Optional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // First look at student table
        StudentLoginDTO loginDTO = studentRepository.getStudentLoginDTOByLoginName(username);
        if (loginDTO != null) {
            return new UserDetailsImpl(new StudentUser(loginDTO));
        }

        // Then look at user table (teacher)
        Optional<User> userOptional = userRepository.findByEmail(username);
        if (userOptional.isPresent()) {
            return new UserDetailsImpl(new TeacherUser(userOptional.get()));
        }

        throw new UsernameNotFoundException("User not found: " + username);
    }
}