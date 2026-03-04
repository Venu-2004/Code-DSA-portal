package com.dsaportal.service;

import com.dsaportal.dto.UpdateProfileRequest;
import com.dsaportal.dto.UpdateProfileResponse;
import com.dsaportal.dto.UserProfileDto;
import com.dsaportal.entity.User;
import com.dsaportal.repository.UserRepository;
import com.dsaportal.security.JwtUtils;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    public UserProfileDto getCurrentUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new UserProfileDto(user);
    }

    public UpdateProfileResponse updateCurrentUserProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getUsername() != null) {
            String updatedUsername = request.getUsername().trim();
            if (updatedUsername.isEmpty()) {
                throw new RuntimeException("Username cannot be empty");
            }
            if (userRepository.existsByUsernameAndIdNot(updatedUsername, user.getId())) {
                throw new RuntimeException("Username is already taken");
            }
            user.setUsername(updatedUsername);
        }

        if (request.getEmail() != null) {
            String updatedEmail = request.getEmail().trim();
            if (updatedEmail.isEmpty()) {
                throw new RuntimeException("Email cannot be empty");
            }
            if (userRepository.existsByEmailAndIdNot(updatedEmail, user.getId())) {
                throw new RuntimeException("Email is already in use");
            }
            user.setEmail(updatedEmail);
        }

        if (request.getMobileNumber() != null) {
            String updatedMobile = request.getMobileNumber().trim();
            if (updatedMobile.isEmpty()) {
                throw new RuntimeException("Mobile number cannot be empty");
            }
            if (userRepository.existsByMobileNumberAndIdNot(updatedMobile, user.getId())) {
                throw new RuntimeException("Mobile number is already in use");
            }
            user.setMobileNumber(updatedMobile);
        }

        if (request.getProfileImage() != null) {
            String profileImage = request.getProfileImage().trim();
            if (profileImage.length() > 2_500_000) {
                throw new RuntimeException("Profile image is too large");
            }
            user.setProfileImage(profileImage.isEmpty() ? null : profileImage);
        }

        if (request.getNewPassword() != null && !request.getNewPassword().trim().isEmpty()) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isEmpty()) {
                throw new RuntimeException("Current password is required to set a new password");
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("Current password is incorrect");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        User updatedUser = userRepository.save(user);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(updatedUser, null, updatedUser.getAuthorities());
        String newToken = jwtUtils.generateJwtToken(authentication);
        return new UpdateProfileResponse(newToken, new UserProfileDto(updatedUser));
    }

    @Transactional
    public User updateUserIdentityByAdmin(Long userId, String username, String email) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (username == null || username.trim().isEmpty()) {
            throw new RuntimeException("Username cannot be empty");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email cannot be empty");
        }

        String updatedUsername = username.trim();
        String updatedEmail = email.trim();

        if (userRepository.existsByUsernameAndIdNot(updatedUsername, user.getId())) {
            throw new RuntimeException("Username is already taken");
        }

        if (userRepository.existsByEmailAndIdNot(updatedEmail, user.getId())) {
            throw new RuntimeException("Email is already in use");
        }

        int updatedRows = userRepository.updateUserIdentity(user.getId(), updatedUsername, updatedEmail);
        if (updatedRows == 0) {
            throw new RuntimeException("No user record updated");
        }

        return userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found after update"));
    }

    @Transactional
    public void deleteUserByAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == User.Role.ADMIN) {
            throw new RuntimeException("Admin account cannot be deleted");
        }

        userRepository.delete(user);
    }
}
