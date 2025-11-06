package org.example.studyroomreservation.config.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.*;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Security configuration for the application.
 * <p>
 * This configuration enables:
 * <ul>
 *     <li>CORS for development environment only</li>
 *     <li>CSRF protection using cookies suitable for SPA (Single Page Application)</li>
 *     <li>Access rules for public endpoints</li>
 *     <li>Form-based login with JSON responses for SPA</li>
 *     <li>Logout handling with JSON responses</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Defines the security filter chain.
     *
     * @param http HttpSecurity object to configure
     * @return SecurityFilterChain object
     * @throws Exception if any error occurs during configuration
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        // TODO: find out how to use default XorCsrfTokenRequestAttributeHandler in SPA
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                )
                .authorizeHttpRequests(auth -> auth
                        // APIエンドポイント以外のすべての静的リソースを許可
                        .requestMatchers(
                                request -> !request.getServletPath().startsWith("/api/")
                        ).permitAll()

                        // 認証不要なAPIエンドポイント
                        .requestMatchers(
                                "/api/student/register",
                                "/api/csrf-token",
                                "/api/login",
                                "/api/me"
                        ).permitAll()

                        // その他のAPIは認証が必要
                        .anyRequest().authenticated()
                )
                // Configure form login for SPA
                .formLogin(login -> login
                        // Login endpoint - Spring Security automatically handles authentication
                        .loginProcessingUrl("/api/login")
                        // Success handler - returns JSON instead of redirecting
                        .successHandler((request, response, authentication) -> {
                            response.setStatus(HttpServletResponse.SC_OK);
                            response.setContentType("application/json;charset=UTF-8");

                            // Build JSON response with user info
                            Map<String, Object> result = new HashMap<>();
                            result.put("success", true);
                            result.put("username", authentication.getName());
                            // maybe just adding one role is enough... list seems ridiculous
                            result.put("role", authentication.getAuthorities().stream()
                                    .map(GrantedAuthority::getAuthority)
                                    .findFirst()
                                    .orElse(null));


                            ObjectMapper mapper = new ObjectMapper();
                            response.getWriter().write(mapper.writeValueAsString(result));
                            response.getWriter().flush();
                        })
                        // Failure handler - returns error JSON with 401 status
                        .failureHandler((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");

                            // Build error response
                            Map<String, Object> result = new HashMap<>();
                            result.put("success", false);
                            result.put("error", exception.getMessage());

                            ObjectMapper mapper = new ObjectMapper();
                            response.getWriter().write(mapper.writeValueAsString(result));
                        })
                        .permitAll()
                )
                // Configure logout for SPA
                .logout(logout -> logout
                        // Logout endpoint - Spring Security automatically invalidates session
                        .logoutUrl("/api/logout")
                        // Success handler - returns JSON confirmation instead of redirecting
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(HttpServletResponse.SC_OK);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"success\": true}");
                        })
                        .permitAll()
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}