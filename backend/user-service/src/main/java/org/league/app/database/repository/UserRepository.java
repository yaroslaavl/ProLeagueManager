package org.league.app.database.repository;

import org.league.app.database.entity.User;
import org.league.app.dto.UserReadDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

      Optional<User> findByUsername(String username);

      Optional<User> findByEmail(String email);

      Optional<User> findByEmailVerificationToken(String emailVerificationToken);

      boolean existsByEmail(String email);

      boolean existsByUsername(String username);

      @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT(:keyword, '%')) AND u.isVerified = TRUE")
      List<User> searchUser(@Param("keyword") String keyword);

}
