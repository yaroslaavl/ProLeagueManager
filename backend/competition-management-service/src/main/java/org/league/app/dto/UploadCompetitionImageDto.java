package org.league.app.dto;

import lombok.Data;
import org.league.app.validation.CompetitionImageCustom;
import org.league.app.validation.CreateAction;
import org.league.app.validation.EditAction;
import org.springframework.web.multipart.MultipartFile;

@Data
public class UploadCompetitionImageDto {

    @CompetitionImageCustom(groups = {CreateAction.class, EditAction.class})
    private MultipartFile competitionImage;
}
