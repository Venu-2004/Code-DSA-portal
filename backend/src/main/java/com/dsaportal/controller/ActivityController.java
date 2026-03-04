package com.dsaportal.controller;

import com.dsaportal.entity.User;
import com.dsaportal.service.UserActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/activity")
public class ActivityController {

    @Autowired
    private UserActivityService userActivityService;

    @PostMapping("/ping")
    public ResponseEntity<Void> ping(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof User user)) {
            return ResponseEntity.status(401).build();
        }

        userActivityService.trackActivity(user.getId());
        return ResponseEntity.ok().build();
    }
}
