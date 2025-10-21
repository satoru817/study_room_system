package org.example.studyroomreservation.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class CsrfController {

    /**
     * Initializes and exposes the CSRF token for the client.
     * <p>
     * When this endpoint is accessed, Spring Security automatically generates
     * a CSRF token (if one does not already exist) and stores it in the user's
     * session and/or a browser cookie, depending on the configured CSRF repository.
     * </p>
     * <p>
     * This method does not return the token itself. Instead, it returns a simple
     * confirmation message indicating that the CSRF token has been initialized.
     * Clients (such as single-page applications) can then read the CSRF token
     * from the response headers or cookies as configured.
     * </p>
     *
     * @return a map containing a message confirming that the CSRF token has been initialized
     */
    @GetMapping("/csrf-token")
    public Map<String, String> getCsrfToken() {
        // Spring Security automatically generates and sets CSRF token in cookie
        // This endpoint just triggers that process
        return Map.of("message", "CSRF token initialized");
    }

}