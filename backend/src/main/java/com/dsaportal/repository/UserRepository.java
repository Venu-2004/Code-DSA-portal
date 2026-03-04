package com.dsaportal.repository;

import com.dsaportal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByMobileNumber(String mobileNumber);
    @Query("SELECT u FROM User u WHERE u.username = :identifier OR u.email = :identifier OR u.mobileNumber = :identifier")
    Optional<User> findByLoginIdentifier(String identifier);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByMobileNumber(String mobileNumber);
    boolean existsByUsernameAndIdNot(String username, Long id);
    boolean existsByEmailAndIdNot(String email, Long id);
    boolean existsByMobileNumberAndIdNot(String mobileNumber, Long id);

    @Modifying
    @Query("UPDATE User u SET u.username = :username, u.email = :email WHERE u.id = :id")
    int updateUserIdentity(@Param("id") Long id,
                           @Param("username") String username,
                           @Param("email") String email);
}
