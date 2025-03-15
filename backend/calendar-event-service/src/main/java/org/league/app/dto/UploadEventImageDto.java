package org.league.app.dto;


import lombok.Data;
import org.league.app.validation.CreateAction;
import org.league.app.validation.EditAction;
import org.league.app.validation.EventImageCustom;
import org.springframework.web.multipart.MultipartFile;

@Data
public class UploadEventImageDto {

    @EventImageCustom(groups = {CreateAction.class, EditAction.class})
    private MultipartFile eventImage;
}
