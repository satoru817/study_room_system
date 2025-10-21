package org.example.studyroomreservation.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class CsrfController {

    @GetMapping("/csrf-token")
    public Map<String, String> getCsrfToken() {
        // Spring Security will save csrf token to browser cookie if you access here
        return Map.of("message", "CSRF token initialized");
    }
}