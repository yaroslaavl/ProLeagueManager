package org.league.app.service;

import io.minio.*;
import io.minio.messages.Item;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Event;
import org.league.app.database.repository.EventRepository;
import org.league.app.dto.UploadEventImageDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinioService {

    @Value("${minio.bucket-name}")
    private String bucket;

    @Value("${minio.url}")
    private String minioUrl;

    private final MinioClient minioClient;
    private final EventRepository eventRepository;

    @SneakyThrows
    @Transactional
    public void uploadImage(UUID eventId, UploadEventImageDto uploadEventImageDto) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (!found) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
        }

        String existing = findExisting(event.getId());
        if (existing != null) {
            deleteObject(existing);
        }

        MultipartFile avatar = uploadEventImageDto.getEventImage();
        String originalFilename = Objects.requireNonNull(avatar.getOriginalFilename());
        String termination = originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf(".") + 1)
                : "png";

        String objectName = "event-images/" + event.getId() + "." + termination;

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

        event.setEventImage(minioUrl + "/" + bucket + "/" + objectName);
        eventRepository.save(event);
    }

    @SneakyThrows
    private String findExisting(UUID competitionId) {
        Iterable<Result<Item>> results = minioClient.listObjects(ListObjectsArgs.builder().bucket(bucket).prefix("event-images/").build());

        for (Result<Item> result : results) {
            Item item = result.get();
            if (item.objectName().startsWith("event-images/" + competitionId)) {
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

    public String getPinnedEventImage(UUID competitionId) {
        Event event = eventRepository.findById(competitionId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        String objectName = "event-images/default-event.png";

        if (event.getEventImage() != null) {
            String existing = findExisting(event.getId());
            if (existing != null) {
                return event.getEventImage();
            }
        }

        return minioUrl + "/" + bucket + "/" + objectName;
    }
}
