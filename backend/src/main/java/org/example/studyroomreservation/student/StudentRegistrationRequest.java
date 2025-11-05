package org.example.studyroomreservation.student;

/**
 * Request object for student registration.
 * <p>
 * This record automatically validates all fields upon construction.
 * Invalid data will result in an IllegalArgumentException.
 * </p>
 *
 * @param token     the registration token (must not be blank)
 * @param loginName the desired login name (must not be blank)
 * @param password  the account password (must be at least 8 characters)
 */
public record StudentRegistrationRequest(String token, String loginName, String password) {

    /**
     * Compact constructor that validates all fields.
     * <p>
     * This constructor is automatically called when creating a new instance.
     * All validation rules are enforced at construction time.
     * </p>
     *
     * @throws IllegalArgumentException if any field is invalid
     */
    public StudentRegistrationRequest {
        loginName = loginName.trim();
        password = password.trim();

        validateNotBlank(token, "Token");
        validateNotBlank(loginName, "Login name");
        validatePassword(password);
    }

    private static void validateNotBlank(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }
    }

    private static void validatePassword(String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password must not be blank");
        }
        if (password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
    }
}