package com.dsaportal.controller;

import com.dsaportal.dto.UpdateProfileRequest;
import com.dsaportal.dto.UpdateProfileResponse;
import com.dsaportal.dto.UserProfileDto;
import com.dsaportal.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getCurrentProfile(Authentication authentication) {
        UserProfileDto profile = userService.getCurrentUserProfile(authentication.getName());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentProfile(
            Authentication authentication,
            @RequestBody UpdateProfileRequest request) {
        try {
            UpdateProfileResponse response = userService.updateCurrentUserProfile(authentication.getName(), request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
