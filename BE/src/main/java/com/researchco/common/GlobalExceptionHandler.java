package com.researchco.common;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.AuthenticationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AppException.class)
    public ResponseEntity<Map<String, Object>> handleAppException(AppException ex) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", ex.getMessage());
        payload.put("status", ex.getStatus().value());
        return ResponseEntity.status(ex.getStatus()).body(payload);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", "Validation failed");
        payload.put("status", HttpStatus.BAD_REQUEST.value());
        payload.put("errors", errors);
        return ResponseEntity.badRequest().body(payload);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getConstraintViolations().forEach(cv -> {
            String path = cv.getPropertyPath().toString();
            String field = path.contains(".") ? path.substring(path.lastIndexOf('.') + 1) : path;
            errors.put(field, cv.getMessage());
        });
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", "Validation failed");
        payload.put("status", HttpStatus.BAD_REQUEST.value());
        payload.put("errors", errors);
        return ResponseEntity.badRequest().body(payload);
    }

    @ExceptionHandler({AuthenticationException.class, AuthenticationCredentialsNotFoundException.class})
    public ResponseEntity<Map<String, Object>> handleAuthentication(Exception ex) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", "Invalid credentials");
        payload.put("status", HttpStatus.UNAUTHORIZED.value());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(payload);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnhandled(Exception ex) {
        log.error("Unhandled exception", ex);
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", ex.getMessage());
        payload.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(payload);
    }
}
