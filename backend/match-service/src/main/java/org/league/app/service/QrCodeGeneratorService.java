package org.league.app.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.league.app.dto.QrCodeDto;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

@Slf4j
@Service
public class QrCodeGeneratorService {

    @SneakyThrows
    public File generateQrCode(QrCodeDto qrCodeDto) {
        log.info("Generate QR Code for matchId={}, teamId={}, players={}, matchDate={}, timestamp={}",
                qrCodeDto.getMatchId(), qrCodeDto.getTeamId(), qrCodeDto.getStartingPlayers(), qrCodeDto.getMatchDate(), qrCodeDto.getTimestamp());

        Map<String, Object> qrData = new HashMap<>();
        qrData.put("matchId", qrCodeDto.getMatchId());
        qrData.put("teamId", qrCodeDto.getTeamId());
        qrData.put("startingPlayers", qrCodeDto.getStartingPlayers());
        qrData.put("matchDate", qrCodeDto.getMatchDate());
        qrData.put("timeStamp", qrCodeDto.getTimestamp());
        try {
            String jsonString = new ObjectMapper().writeValueAsString(qrData);
            BitMatrix bitMatrix = new QRCodeWriter().encode(jsonString, BarcodeFormat.QR_CODE, 200, 200);
            BufferedImage bufferedImage = MatrixToImageWriter.toBufferedImage(bitMatrix);

            Path tempFile = Files.createTempFile("QRCode_", ".png");
            ImageIO.write(bufferedImage, "png", tempFile.toFile());

            return tempFile.toFile();
        } catch (Exception e) {
            throw new RuntimeException("Error generating QR Code", e);
        }
    }
}
