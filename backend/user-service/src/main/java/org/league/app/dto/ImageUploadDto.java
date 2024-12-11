package org.league.app.dto;

import lombok.Data;
import org.league.app.validation.CreateAction;
import org.league.app.validation.EditAction;
import org.league.app.validation.ImageCustom;
import org.springframework.web.multipart.MultipartFile;

@Data
public class ImageUploadDto {

    @ImageCustom(groups = {CreateAction.class, EditAction.class})
    private MultipartFile avatar;
}
