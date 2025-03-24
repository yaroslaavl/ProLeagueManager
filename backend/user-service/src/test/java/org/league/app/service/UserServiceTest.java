package org.league.app.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.league.app.database.entity.Role;
import org.league.app.database.entity.RoleGroup;
import org.league.app.database.entity.User;
import org.league.app.database.repository.RoleGroupRepository;
import org.league.app.database.repository.UserRepository;
import org.league.app.dto.EmailResetPasswordDto;
import org.league.app.dto.ResetPasswordDto;
import org.league.app.dto.UserCreateDto;
import org.league.app.dto.UserReadDto;
import org.league.app.feign.EmailRequest;
import org.league.app.feign.NotificationFeignClient;
import org.league.app.mapper.UserMapper;
import org.league.app.redisclient.RedisClient;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @InjectMocks
    private UserService userService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserMapper userMapper;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private RoleGroupRepository roleGroupRepository;
    @Mock
    private NotificationFeignClient notificationFeignClient;
    @Mock
    private RedisClient redisClient;

    private UserCreateDto userCreateDto;
    private User user;
    private RoleGroup roleGroup;
    private UserReadDto userReadDto;


    @BeforeEach
    void setup() {
        userCreateDto = new UserCreateDto();
        userCreateDto.setUsername("user");
        userCreateDto.setPassword("Password!123");
        userCreateDto.setEmail("test@gmail.com");
        userCreateDto.setFirstName("Test");
        userCreateDto.setLastName("Test");
        userCreateDto.setBirthDate(LocalDate.of(2004, 9, 6));

        roleGroup = new RoleGroup();
        Role role = new Role();
        role.setName("USER");
        roleGroup.setRoles(List.of(role));

        user = new User();
        user.setId(1L);
        user.setUsername("user");
        user.setPassword("Password!123");
        user.setEmail("test@gmail.com");
        user.setFirstName("Test");
        user.setLastName("Test");
        user.setBirthDate(LocalDate.of(2004, 9, 6));
        user.setRoleGroup(roleGroup);
        user.setIsVerified(false);

        userReadDto = new UserReadDto(1L, "user", "test@gmail.com", "Test", "Test",
                LocalDate.of(2004, 9, 6), null, false, null, LocalDateTime.now());
    }

    @Test
    void createTest() {
        when(roleGroupRepository.findByName("USER")).thenReturn(Optional.of(roleGroup));

        when(userMapper.toEntity(userCreateDto, passwordEncoder)).thenReturn(user);

        when(userRepository.saveAndFlush(user)).thenReturn(user);

        when(userMapper.toDto(user)).thenReturn(userReadDto);

        when(notificationFeignClient.sendEmail(any(EmailRequest.class))).thenReturn("OK");
        doNothing().when(redisClient).set(anyString(), anyString(), anyLong(), any());

        UserReadDto result = userService.create(userCreateDto);

        assertNotNull(result);
        assertEquals(user.getId(), result.getId());
        assertEquals(user.getUsername(), result.getUsername());
        assertEquals(user.getEmail(), result.getEmail());
        assertEquals(user.getFirstName(), result.getFirstName());
        assertEquals(user.getLastName(), result.getLastName());
        assertEquals(user.getBirthDate(), result.getBirthDate());

        verify(roleGroupRepository).findByName("USER");
        verify(userMapper).toEntity(userCreateDto, passwordEncoder);
        verify(userRepository).saveAndFlush(user);
        verify(notificationFeignClient).sendEmail(any(EmailRequest.class));
        verify(redisClient).set(anyString(), anyString(), anyLong(), any());
    }

    @Test
    void getUserTest() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        when(userMapper.toDto(user)).thenReturn(userReadDto);

        UserReadDto result = userService.getUser(1L);

        assertEquals(user.getId(), result.getId());
        assertEquals(user.getUsername(), result.getUsername());
        assertEquals(user.getEmail(), result.getEmail());
        assertEquals(user.getFirstName(), result.getFirstName());
        assertEquals(user.getLastName(), result.getLastName());
        assertEquals(user.getBirthDate(), result.getBirthDate());

        verify(userRepository).findById(1L);
        verify(userMapper).toDto(user);
    }

    @Test
    void sendPasswordResetEmailTest(){
        EmailResetPasswordDto method = new EmailResetPasswordDto();
        method.setEmail(user.getEmail());

        when(userRepository.existsByEmail(method.getEmail())).thenReturn(true);

        when(notificationFeignClient.sendEmail(any(EmailRequest.class))).thenReturn("OK");
        doNothing().when(redisClient).set(anyString(), anyString(), anyLong(), any());

        boolean result = userService.sendPasswordResetEmail(method);

        assertTrue(result);

        verify(userRepository).existsByEmail(method.getEmail());
        verify(notificationFeignClient).sendEmail(any(EmailRequest.class));
        verify(redisClient, times(2)).set(anyString(), anyString(), anyLong(), any());
    }

    @Test
    void resetPasswordTest() {
        String token  = "test-token";
        String encodedPassword = "encodedNewPassword";
        String userEmail = user.getEmail();
        ResetPasswordDto resetPasswordDto = new ResetPasswordDto();
        resetPasswordDto.setNewPassword("NewPassword!123");

        when(redisClient.get(token)).thenReturn(userEmail);
        when(redisClient.get(userEmail + ":resetPasswordToken")).thenReturn(token);

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(resetPasswordDto.getNewPassword())).thenReturn(encodedPassword);

        userService.resetPassword(resetPasswordDto, token);

        verify(userRepository).save(user);
        verify(redisClient).delete(userEmail + ":resetPasswordToken");
        verify(redisClient).delete(token);

        assertEquals(encodedPassword, user.getPassword());
    }

    @Test
    void loadUserByUsernameTest() {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        UserDetails userDetails = userService.loadUserByUsername(user.getEmail());

        assertNotNull(userDetails);
        assertEquals(user.getEmail(), userDetails.getUsername());

        boolean hasRoleUser = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("USER"));
        assertTrue(hasRoleUser);
    }
}