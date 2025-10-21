package org.example.studyroomreservation.config.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * CORS (Cross-Origin Resource Sharing) configuration for the application.
 * <p>
 * This configuration allows cross-origin requests only in the development environment
 * where the frontend runs on a different origin (e.g., http://localhost:5173).
 * In production, CORS is unnecessary because the frontend and backend share the same origin.
 */
@Configuration
public class CorsConfig {

    @Value("${spring.profiles.active:prod}")
    private String activeProfile;

    /**
     * Defines the CORS configuration source for Spring Security.
     * <p>
     * - In development profile ("dev"), only http://localhost:5173 is allowed.
     * - Allows common HTTP methods (GET, POST, PUT, DELETE, OPTIONS).
     * - Supports all headers and credentials (cookies).
     * - Applies only to URLs matching /api/**.
     * - In production, CORS is disabled (returns null).
     *
     * @return the CorsConfigurationSource to be used by Spring Security
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        if ("dev".equals(activeProfile)) {
            CorsConfiguration configuration = new CorsConfiguration();
            configuration.setAllowedOrigins(List.of("http://localhost:5173"));
            configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
            configuration.setAllowedHeaders(List.of(CorsConfiguration.ALL));//"*" means all
            configuration.setAllowCredentials(true);
            configuration.setMaxAge(3600L);

            UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
            source.registerCorsConfiguration("/api/**", configuration);
            return source;
        }

        // CORS not needed in production(lambda expression)
        return request -> null;
    }
}
