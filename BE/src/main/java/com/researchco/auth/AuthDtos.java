package com.researchco.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record UserSummary(
            String id,
            String name,
            String email,
            String role
    ) {
    }

    public record RegisterRequest(
            @NotBlank String fullName,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 100) String password
    ) {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {
    }

    public record AuthResponse(
            String token,
            String tokenType,
            String userId,
            String email,
            String fullName,
            String role,
            UserSummary user
    ) {
    }
}
