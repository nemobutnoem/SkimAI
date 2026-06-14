package com.researchco.auth;

import com.researchco.common.AppException;
import com.researchco.plan.PlanEntity;
import com.researchco.plan.PlanRepository;
import com.researchco.security.AuthUser;
import com.researchco.security.JwtTokenService;
import com.researchco.subscription.UserSubscriptionEntity;
import com.researchco.subscription.UserSubscriptionRepository;
import com.researchco.user.UserEntity;
import com.researchco.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

        private record GoogleTokenInfo(
                        String aud,
                        String email,
                        String email_verified,
                        String name,
                        String picture,
                        String sub
        ) {
        }

    private final UserRepository userRepository;
    private final PlanRepository planRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenService jwtTokenService;
        private final RestClient googleRestClient;
        private final String googleClientId;

    public AuthService(UserRepository userRepository,
                       PlanRepository planRepository,
                       UserSubscriptionRepository userSubscriptionRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                                           JwtTokenService jwtTokenService,
                                           org.springframework.core.env.Environment env) {
        this.userRepository = userRepository;
        this.planRepository = planRepository;
        this.userSubscriptionRepository = userSubscriptionRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenService = jwtTokenService;

                this.googleRestClient = RestClient.builder()
                                .baseUrl("https://oauth2.googleapis.com")
                                .build();
                this.googleClientId = env.getProperty("app.auth.google.client-id", "");
    }

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Email already exists");
        }

        UserEntity user = UserEntity.builder()
                .fullName(request.fullName())
                .email(request.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role("USER")
                .status("ACTIVE")
                .build();
        userRepository.save(user);

        ensureFreeSubscription(user);

        AuthUser authUser = new AuthUser(user.getId(), user.getEmail(), user.getPasswordHash(), user.getRole(), user.getStatus());
        String token = jwtTokenService.generateToken(authUser);
        return new AuthDtos.AuthResponse(
                token,
                "Bearer",
                user.getId().toString(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                new AuthDtos.UserSummary(
                        user.getId().toString(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getRole().toLowerCase()
                )
        );
    }

        @Transactional
        public AuthDtos.AuthResponse loginWithGoogle(AuthDtos.GoogleLoginRequest request) {
                if (googleClientId == null || googleClientId.isBlank()) {
                        throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Google login is not configured");
                }

                GoogleTokenInfo info;
                try {
                        info = googleRestClient.get()
                                        .uri(uriBuilder -> uriBuilder
                                                        .path("/tokeninfo")
                                                        .queryParam("id_token", request.credential())
                                                        .build())
                                        .retrieve()
                                        .body(GoogleTokenInfo.class);
                } catch (RestClientException ex) {
                        throw new AppException(HttpStatus.UNAUTHORIZED, "Invalid Google credential");
                }

                if (info == null || info.email() == null || info.email().isBlank()) {
                        throw new AppException(HttpStatus.UNAUTHORIZED, "Invalid Google credential");
                }
                if (info.aud() == null || !googleClientId.equals(info.aud())) {
                        throw new AppException(HttpStatus.UNAUTHORIZED, "Google credential audience mismatch");
                }
                if (info.email_verified() != null && !"true".equalsIgnoreCase(info.email_verified())) {
                        throw new AppException(HttpStatus.UNAUTHORIZED, "Google email is not verified");
                }

                String normalizedEmail = info.email().toLowerCase();
                UserEntity user = userRepository.findByEmail(normalizedEmail)
                                .orElseGet(() -> {
                                        String fullName = (info.name() != null && !info.name().isBlank())
                                                        ? info.name()
                                                        : normalizedEmail;
                                        UserEntity created = UserEntity.builder()
                                                        .fullName(fullName)
                                                        .email(normalizedEmail)
                                                        .avatarUrl(info.picture())
                                                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                                                        .role("USER")
                                                        .status("ACTIVE")
                                                        .build();
                                        return userRepository.save(created);
                                });

                ensureFreeSubscription(user);

                AuthUser authUser = new AuthUser(user.getId(), user.getEmail(), user.getPasswordHash(), user.getRole(), user.getStatus());
                String token = jwtTokenService.generateToken(authUser);
                return new AuthDtos.AuthResponse(
                                token,
                                "Bearer",
                                user.getId().toString(),
                                user.getEmail(),
                                user.getFullName(),
                                user.getRole(),
                                new AuthDtos.UserSummary(
                                                user.getId().toString(),
                                                user.getFullName(),
                                                user.getEmail(),
                                                user.getRole().toLowerCase()
                                )
                );
        }

    @Transactional(readOnly = true)
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        String normalizedEmail = request.email().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
        );
        UserEntity user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        AuthUser authUser = new AuthUser(user.getId(), user.getEmail(), user.getPasswordHash(), user.getRole(), user.getStatus());
        String token = jwtTokenService.generateToken(authUser);
        return new AuthDtos.AuthResponse(
                token,
                "Bearer",
                user.getId().toString(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                new AuthDtos.UserSummary(
                        user.getId().toString(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getRole().toLowerCase()
                )
        );
    }

    private void ensureFreeSubscription(UserEntity user) {
        if (userSubscriptionRepository.countByUser(user) > 0) return;

        PlanEntity freePlan = planRepository.findByName("FREE")
                .orElseThrow(() -> new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "FREE plan not found"));
        UserSubscriptionEntity subscription = UserSubscriptionEntity.builder()
                .user(user)
                .plan(freePlan)
                .startDate(LocalDateTime.now())
                .status("ACTIVE")
                .build();
        userSubscriptionRepository.save(subscription);
    }
}
