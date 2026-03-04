package com.dsaportal.service;

import com.dsaportal.entity.User;
import com.dsaportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class UserActivityService {

    private static final long MAX_GAP_SECONDS = 300L;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void trackActivity(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastActiveAt = user.getLastActiveAt();

        if (lastActiveAt != null) {
            long secondsSinceLastActivity = Duration.between(lastActiveAt, now).getSeconds();
            if (secondsSinceLastActivity > 0) {
                long boundedSeconds = Math.min(secondsSinceLastActivity, MAX_GAP_SECONDS);
                long currentTotal = user.getTotalActiveSeconds() != null ? user.getTotalActiveSeconds() : 0L;
                user.setTotalActiveSeconds(currentTotal + boundedSeconds);
            }
        }

        user.setLastActiveAt(now);
        userRepository.save(user);
    }
}
