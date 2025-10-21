package org.example.studyroomreservation.config.security.user;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class UserDetailsImpl implements UserDetails {
    private final AbstractLoginClient loginClient;

    public UserDetailsImpl(AbstractLoginClient loginClient) {
        this.loginClient = loginClient;
    }

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
}
