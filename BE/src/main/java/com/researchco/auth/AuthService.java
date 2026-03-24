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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PlanRepository planRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenService jwtTokenService;

    public AuthService(UserRepository userRepository,
                       PlanRepository planRepository,
                       UserSubscriptionRepository userSubscriptionRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenService jwtTokenService) {
        this.userRepository = userRepository;
        this.planRepository = planRepository;
        this.userSubscriptionRepository = userSubscriptionRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenService = jwtTokenService;
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

        PlanEntity freePlan = planRepository.findByName("FREE")
                .orElseThrow(() -> new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "FREE plan not found"));
        UserSubscriptionEntity subscription = UserSubscriptionEntity.builder()
                .user(user)
                .plan(freePlan)
                .startDate(LocalDateTime.now())
                .status("ACTIVE")
                .build();
        userSubscriptionRepository.save(subscription);

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
}
