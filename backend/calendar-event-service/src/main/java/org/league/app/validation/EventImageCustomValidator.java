package org.league.app.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.web.multipart.MultipartFile;

public class EventImageCustomValidator implements ConstraintValidator<EventImageCustom, MultipartFile> {

    private static final long MAX_SIZE = 2 * 1024 * 1024;
    private static final String[] CONTENT_TYPES = {"image/jpeg", "image/png", "image/jpg"};
    public static final String[] VALID_EXTENSIONS = {".jpeg", ".jpg", ".png"};

    @Override
    public boolean isValid(MultipartFile file, ConstraintValidatorContext constraintValidatorContext) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_SIZE) {
            return false;
        }

        String contentType = file.getContentType();
        boolean isValidContentType = false;
        for (String validContentType : CONTENT_TYPES) {
            if (validContentType.equals(contentType)){
                isValidContentType = true;
                break;
            }
        }

        if (!isValidContentType) {
            return false;
        }

        String filename = file.getOriginalFilename();
        if (filename != null) {
            for (String extension : VALID_EXTENSIONS) {
                if (filename.toLowerCase().endsWith(extension)) {
                    return true;
                }
            }
        }

        return false;
    }
}
