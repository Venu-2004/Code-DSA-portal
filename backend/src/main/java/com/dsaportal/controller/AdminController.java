package com.dsaportal.controller;

import com.dsaportal.dto.AdminLeaderboardDto;
import com.dsaportal.dto.AdminUserUpdateRequest;
import com.dsaportal.dto.LeaderboardEntryDto;
import com.dsaportal.dto.UserSummaryDto;
import com.dsaportal.entity.User;
import com.dsaportal.repository.UserRepository;
import com.dsaportal.service.SubmissionService;
import com.dsaportal.service.UserService;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubmissionService submissionService;

    @Autowired
    private UserService userService;

    @GetMapping("/users")
    public ResponseEntity<List<UserSummaryDto>> getAllUsers() {
        List<User> users = userRepository.findAll();
        
        List<UserSummaryDto> userSummaries = users.stream().map(user -> {
            Long totalSubmissions = submissionService.getTotalSubmissionsByUserId(user.getId());
            Long solvedProblems = submissionService.getAcceptedSubmissionsByUserId(user.getId());
            Double averageAccuracy = submissionService.getAverageAccuracyByUserId(user.getId());
            Long totalActiveSeconds = user.getTotalActiveSeconds() != null ? user.getTotalActiveSeconds() : 0L;
            
            return new UserSummaryDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                totalSubmissions,
                solvedProblems,
                averageAccuracy,
                totalActiveSeconds
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(userSummaries);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<AdminLeaderboardDto> getLeaderboard() {
        List<User> students = userRepository.findAll()
                .stream()
                .filter(user -> user.getRole() == User.Role.USER)
                .collect(Collectors.toList());

        List<LeaderboardEntryDto> entries = students.stream().map(student -> {
            Long totalSubmissions = submissionService.getTotalSubmissionsByUserId(student.getId());
            Long solvedProblems = submissionService.getAcceptedSubmissionsByUserId(student.getId());
            Double averageAccuracy = submissionService.getAverageAccuracyByUserId(student.getId());
            Long totalActiveSeconds = student.getTotalActiveSeconds() != null ? student.getTotalActiveSeconds() : 0L;
            return new LeaderboardEntryDto(
                    student.getId(),
                    student.getUsername(),
                    solvedProblems,
                    totalSubmissions,
                    averageAccuracy,
                    totalActiveSeconds
            );
        }).sorted(
                Comparator.comparing(LeaderboardEntryDto::getSolvedProblems, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(LeaderboardEntryDto::getAverageAccuracy, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(LeaderboardEntryDto::getTotalSubmissions, Comparator.nullsLast(Comparator.reverseOrder()))
        ).collect(Collectors.toList());

        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }

        long totalSolvedProblems = entries.stream()
                .map(LeaderboardEntryDto::getSolvedProblems)
                .filter(value -> value != null)
                .mapToLong(Long::longValue)
                .sum();

        long totalPlatformTimeSeconds = entries.stream()
                .map(LeaderboardEntryDto::getTotalActiveSeconds)
                .filter(value -> value != null)
                .mapToLong(Long::longValue)
                .sum();

        double averageAccuracy = entries.isEmpty() ? 0.0 : entries.stream()
                .map(LeaderboardEntryDto::getAverageAccuracy)
                .filter(value -> value != null)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);

        AdminLeaderboardDto response = new AdminLeaderboardDto(
                entries.size(),
                totalSolvedProblems,
                totalPlatformTimeSeconds,
                averageAccuracy,
                entries
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<?> updateUserByAdmin(
            @PathVariable Long userId,
            @RequestBody AdminUserUpdateRequest request) {
        try {
            User updatedUser = userService.updateUserIdentityByAdmin(userId, request.getUsername(), request.getEmail());
            Long totalSubmissions = submissionService.getTotalSubmissionsByUserId(updatedUser.getId());
            Long solvedProblems = submissionService.getAcceptedSubmissionsByUserId(updatedUser.getId());
            Double averageAccuracy = submissionService.getAverageAccuracyByUserId(updatedUser.getId());
            Long totalActiveSeconds = updatedUser.getTotalActiveSeconds() != null ? updatedUser.getTotalActiveSeconds() : 0L;

            UserSummaryDto summary = new UserSummaryDto(
                    updatedUser.getId(),
                    updatedUser.getUsername(),
                    updatedUser.getEmail(),
                    updatedUser.getRole().name(),
                    totalSubmissions,
                    solvedProblems,
                    averageAccuracy,
                    totalActiveSeconds
            );

            return ResponseEntity.ok(summary);
        } catch (RuntimeException ex) {
            Throwable rootCause = NestedExceptionUtils.getMostSpecificCause(ex);
            String message = (rootCause != null && rootCause.getMessage() != null)
                    ? rootCause.getMessage()
                    : ex.getMessage();
            return ResponseEntity.badRequest().body(message);
        }
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUserByAdmin(@PathVariable Long userId) {
        try {
            userService.deleteUserByAdmin(userId);
            return ResponseEntity.ok("User deleted successfully");
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
