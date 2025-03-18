package org.league.app.service;

import io.minio.*;
import io.minio.messages.Item;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Competition;
import org.league.app.database.repository.CompetitionRepository;
import org.league.app.dto.UploadCompetitionImageDto;
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

    public static String MINIO_INTERNAL_URL = "minio";
    public static String MINIO_PUBLIC_URL = "localhost";

    private final MinioClient minioClient;
    private final CompetitionRepository competitionRepository;

    @SneakyThrows
    @Transactional
    public void uploadImage(UUID competitionId, UploadCompetitionImageDto uploadCompetitionImageDto) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (!found) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
        }

        String existing = findExisting(competition.getId());
        if (existing != null) {
            deleteObject(existing);
        }

        MultipartFile avatar = uploadCompetitionImageDto.getCompetitionImage();
        String originalFilename = Objects.requireNonNull(avatar.getOriginalFilename());
        String termination = originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf(".") + 1)
                : "png";

        String objectName = "competition-images/" + competition.getId() + "." + termination;

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

        competition.setCompetitionImage(minioUrl.contains(MINIO_INTERNAL_URL)
                ? minioUrl.replace(MINIO_INTERNAL_URL, MINIO_PUBLIC_URL) + "/" + bucket + "/" + objectName
                : minioUrl + "/" + bucket + "/" + objectName);
        competitionRepository.save(competition);
    }

    @SneakyThrows
    private String findExisting(UUID competitionId) {
        Iterable<Result<Item>> results = minioClient.listObjects(ListObjectsArgs.builder().bucket(bucket).prefix("competition-images/").build());

        for (Result<Item> result : results) {
            Item item = result.get();
            if (item.objectName().startsWith("competition-images/" + competitionId)) {
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

    public String getCompetitionImage(UUID competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        String objectName = "competition-images/default-competition.png";

        if (competition.getCompetitionImage() != null) {
            String existing = findExisting(competition.getId());
            if (existing != null) {
                return competition.getCompetitionImage();
            }
        }

        return minioUrl + "/" + bucket + "/" + objectName;
    }
}
