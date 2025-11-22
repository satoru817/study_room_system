package org.example.studyroomreservation.config.security.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public record UserDetailsImpl(AbstractLoginClient loginClient) implements UserDetails {
    private static final Logger log = LoggerFactory.getLogger(UserDetailsImpl.class);

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(loginClient.authority.name()));
    }

    @Override
    public String getPassword() {
        return loginClient.password;// this is bcrypted
    }

    @Override
    public String getUsername() {
        return loginClient.userName;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    public TeacherUser convertToTeacher()
    {
        try {
            return (TeacherUser) this.loginClient;
        } catch (Exception e) {
            log.error("Failed to convert to TeacherUser, loginClient type: {}, Error: {}",
                loginClient != null ? loginClient.getClass().getName() : "null", e.getMessage(), e);
            return null;
        }
    }

    public StudentUser convertToStudent()
    {
        try {
            return (StudentUser) loginClient;
        } catch (Exception e) {
            log.error("Failed to convert to StudentUser, loginClient type: {}, Error: {}",
                loginClient != null ? loginClient.getClass().getName() : "null", e.getMessage(), e);
            return null;
        }
    }
}
