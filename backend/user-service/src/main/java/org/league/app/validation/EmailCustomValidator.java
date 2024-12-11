package org.league.app.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class EmailCustomValidator implements ConstraintValidator<EmailСustom, String> {

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        if(email == null){
            return false;
        }
        var pattern = Pattern.compile("^(?=.{1,64}@)[A-Za-z0-9_-]" +
                    "+(\\.[A-Za-z0-9_-]+)*@" +
                    "[^-][A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*(\\.[A-Za-z]{2,})$");

        var matcher = pattern.matcher(email);
        return matcher.matches();
    }
}
