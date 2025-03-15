package org.league.app.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.web.multipart.MultipartFile;

public class CompetitionImageCustomValidator implements ConstraintValidator<CompetitionImageCustom, MultipartFile> {

    private static final long MAX_SIZE = 3 * 1024 * 1024;
    private static final String[] CONTENT_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/svg+xml"};
    private static final String[] VALID_EXTENSIONS = {".jpeg", ".jpg", ".png", ".svg"};

    @Override
    public boolean isValid(MultipartFile file, ConstraintValidatorContext constraintValidatorContext) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_SIZE) {
            return false;
        }

        boolean isValid = false;
        for (String contentType : CONTENT_TYPES) {
            if (contentType.equals(file.getContentType())) {
                isValid = true;
                break;
            }
        }

        if (!isValid) {
            return false;
        }

        String filename = file.getOriginalFilename();
        if (filename != null) {
            for (String ext : VALID_EXTENSIONS) {
                if (filename.toLowerCase().endsWith(ext)) {
                    return true;
                }
            }
        }

        return false;
    }
}
