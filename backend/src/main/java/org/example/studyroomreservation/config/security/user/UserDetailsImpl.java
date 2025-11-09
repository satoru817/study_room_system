package org.example.studyroomreservation.config.security.user;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public record UserDetailsImpl(AbstractLoginClient loginClient) implements UserDetails {

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
            throw new RuntimeException(e);
        }
    }

    public StudentUser convertToStudent()
    {
        try {
            return (StudentUser) loginClient;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
