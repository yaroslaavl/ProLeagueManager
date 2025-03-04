package org.league.app.service;

import io.minio.*;
import io.minio.messages.Item;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.User;
import org.league.app.database.repository.UserRepository;
import org.league.app.dto.ImageUploadDto;
import org.league.app.exception.UserEmailNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinioService {

    @Value("${minio.bucket-name}")
    private String bucket;

    @Value("${minio.url}")
    private String minioUrl;

    private final MinioClient minioClient;
    private final UserRepository userRepository;

    @SneakyThrows
    @Transactional
    public void uploadImage(ImageUploadDto imageUploadDto) {
        User user = userRepository.findByEmail(securityContext())
                .orElseThrow(() -> new UserEmailNotFoundException("User with username: " + securityContext() + " not found"));

        boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (!found) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
        }

        String existing = findExisting(user.getEmail());
        if (existing != null) {
            deleteObject(existing);
        }

        MultipartFile avatar = imageUploadDto.getAvatar();
        String originalFilename = Objects.requireNonNull(avatar.getOriginalFilename());
        String termination = originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf(".") + 1)
                : "png";

        String objectName = "avatars/" + user.getEmail() + "." + termination;

        minioClient.setBucketPolicy(
                SetBucketPolicyArgs.builder()
                        .bucket(bucket)
                        .config("""
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": "arn:aws:s3:::%s/*"
                }
            ]
        }
        """.formatted(bucket))
                        .build()
        );

        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectName)
                        .stream(avatar.getInputStream(), avatar.getSize(), -1)
                        .contentType(avatar.getContentType())
                        .build()
        );

        user.setAvatar(minioUrl + "/" + bucket + "/" + objectName);
        userRepository.save(user);
    }

    @SneakyThrows
    private String findExisting(String email) {
        Iterable<Result<Item>> results = minioClient.listObjects(ListObjectsArgs.builder().bucket(bucket).prefix("avatars/").build());

        for (Result<Item> result : results) {
            Item item = result.get();
            if (item.objectName().startsWith("avatars/" + email)) {
                return item.objectName();
            }
        }
        return null;
    }

    @SneakyThrows
    private void deleteObject(String objectName) {
        minioClient.removeObject(
                RemoveObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectName)
                        .build()
        );
        log.info("Deleted object: {}", objectName);
    }

    public String getUserAvatar(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserEmailNotFoundException("User with username: " + username + " not found"));

        String objectName = "avatars/default-user.png";

        if (user.getAvatar() != null) {
            String existing = findExisting(user.getEmail());
            if (existing != null) {
                return user.getAvatar();
            }
        }

        return minioUrl + "/" + bucket + "/" + objectName;
    }

    private String securityContext() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
