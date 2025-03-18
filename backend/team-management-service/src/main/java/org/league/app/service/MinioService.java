package org.league.app.service;

import io.minio.*;
import io.minio.messages.Item;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Team;
import org.league.app.database.repository.TeamRepository;
import org.league.app.dto.UploadTeamLogoDto;
import org.league.app.exception.TeamNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinioService {

    private final TeamService teamService;
    @Value("${minio.bucket-name}")
    private String bucket;

    @Value("${minio.url}")
    private String minioUrl;

    public static String MINIO_INTERNAL_URL = "minio";
    public static String MINIO_PUBLIC_URL = "localhost";

    private final MinioClient minioClient;
    private final TeamRepository teamRepository;

    @SneakyThrows
    @Transactional
    public void uploadImage(UUID teamId, UploadTeamLogoDto uploadTeamLogoDto) {
        Team team = teamService.getTeamWithAccessCheck(teamId);

        boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (!found) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
        }

        String existing = findExisting(team.getId());
        if (existing != null) {
            deleteObject(existing);
        }

        MultipartFile avatar = uploadTeamLogoDto.getTeamLogo();
        String originalFilename = Objects.requireNonNull(avatar.getOriginalFilename());
        String termination = originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf(".") + 1)
                : "png";

        String objectName = "team-logos/" + team.getId() + "." + termination;

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

        team.setTeamImage(minioUrl.contains(MINIO_INTERNAL_URL)
                ? minioUrl.replace(MINIO_INTERNAL_URL, MINIO_PUBLIC_URL) + "/" + bucket + "/" + objectName
                : minioUrl + "/" + bucket + "/" + objectName);
        teamRepository.save(team);
    }

    @SneakyThrows
    private String findExisting(UUID teamId) {
        Iterable<Result<Item>> results = minioClient.listObjects(ListObjectsArgs.builder().bucket(bucket).prefix("team-logos/").build());

        for (Result<Item> result : results) {
            Item item = result.get();
            if (item.objectName().startsWith("team-logos/" + teamId)) {
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

    public String getTeamLogo(UUID teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new TeamNotFoundException("Team not found"));

        String objectName = "team-logos/default-team.png";

        if (team.getTeamImage() != null) {
            String existing = findExisting(team.getId());
            if (existing != null) {
                return team.getTeamImage();
            }
        }

        return minioUrl + "/" + bucket + "/" + objectName;
    }
}
