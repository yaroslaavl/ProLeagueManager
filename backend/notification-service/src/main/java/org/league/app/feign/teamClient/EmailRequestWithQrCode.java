package org.league.app.feign.teamClient;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.File;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmailRequestWithQrCode {
    private String to;
    private String subject;
    private String body;
    private File qrCodeFile;
}
