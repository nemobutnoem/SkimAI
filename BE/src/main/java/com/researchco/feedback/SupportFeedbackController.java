package com.researchco.feedback;

import com.researchco.security.SecurityUtils;
import com.researchco.user.UserEntity;
import com.researchco.user.UserRepository;
import com.researchco.common.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class SupportFeedbackController {

    private final SupportFeedbackRepository feedbackRepository;
    private final UserRepository userRepository;

    public SupportFeedbackController(SupportFeedbackRepository feedbackRepository, UserRepository userRepository) {
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
    }

    public record SubmitFeedbackRequest(
            String name,
            String email,
            String category,
            String title,
            String content
    ) {}

    public record FeedbackResponse(
            UUID id,
            UUID userId,
            String name,
            String email,
            String category,
            String title,
            String content,
            String status,
            String adminReply,
            java.time.LocalDateTime createdAt
    ) {
        public static FeedbackResponse fromEntity(SupportFeedbackEntity entity) {
            return new FeedbackResponse(
                    entity.getId(),
                    entity.getUser() != null ? entity.getUser().getId() : null,
                    entity.getName(),
                    entity.getEmail(),
                    entity.getCategory(),
                    entity.getTitle(),
                    entity.getContent(),
                    entity.getStatus(),
                    entity.getAdminReply(),
                    entity.getCreatedAt()
            );
        }
    }

    @PostMapping("/support/feedback")
    public FeedbackResponse submitFeedback(@RequestBody SubmitFeedbackRequest request) {
        if (request.content() == null || request.content().isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Content is required");
        }
        if (request.title() == null || request.title().isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Title is required");
        }

        UserEntity user = null;
        String name = request.name();
        String email = request.email();

        UUID currentUserId = SecurityUtils.currentUserId();
        if (currentUserId != null) {
            Optional<UserEntity> userOpt = userRepository.findById(currentUserId);
            if (userOpt.isPresent()) {
                user = userOpt.get();
                name = user.getFullName();
                email = user.getEmail();
            }
        }

        if (name == null || name.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Name is required");
        }
        if (email == null || email.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        SupportFeedbackEntity feedback = SupportFeedbackEntity.builder()
                .user(user)
                .name(name)
                .email(email)
                .category(request.category() != null ? request.category().toUpperCase() : "BUG")
                .title(request.title())
                .content(request.content())
                .status("PENDING")
                .build();

        feedback = feedbackRepository.save(feedback);
        return FeedbackResponse.fromEntity(feedback);
    }

    @GetMapping("/admin/feedbacks")
    public List<FeedbackResponse> getFeedbacks() {
        return feedbackRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(FeedbackResponse::fromEntity)
                .toList();
    }

    @PutMapping("/admin/feedbacks/{id}/status")
    public FeedbackResponse updateStatus(@PathVariable("id") UUID id, @RequestBody Map<String, String> body) {
        String nextStatus = body.get("status");
        if (nextStatus != null && !nextStatus.equalsIgnoreCase("PENDING") && !nextStatus.equalsIgnoreCase("RESOLVED")) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Invalid status");
        }

        SupportFeedbackEntity feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Feedback not found"));

        if (nextStatus != null) {
            feedback.setStatus(nextStatus.toUpperCase());
        }
        if (body.containsKey("adminReply")) {
            feedback.setAdminReply(body.get("adminReply"));
        }
        feedback = feedbackRepository.save(feedback);
        return FeedbackResponse.fromEntity(feedback);
    }

    @GetMapping("/support/feedbacks")
    public List<FeedbackResponse> getMyFeedbacks() {
        UUID currentUserId = SecurityUtils.currentUserId();
        if (currentUserId == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "User must be authenticated");
        }
        return feedbackRepository.findAllByUserIdOrderByCreatedAtDesc(currentUserId).stream()
                .map(FeedbackResponse::fromEntity)
                .toList();
    }
}
