package org.league.app.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalDate;

public class AgeLimitValidator implements ConstraintValidator<AgeLimit, LocalDate> {

    int minYear;
    int minAge;

    @Override
    public void initialize(AgeLimit constraintAnnotation) {
        this.minAge = constraintAnnotation.minAge();
        this.minYear = constraintAnnotation.minYear();
    }

    @Override
    public boolean isValid(LocalDate localDate, ConstraintValidatorContext constraintValidatorContext) {
        if (localDate != null) {
            var now = LocalDate.now();
            var minAgeOfUser = now.minusYears(this.minAge);
            var minYearDate = LocalDate.of(this.minYear, 1, 1);
            return localDate.isBefore(minAgeOfUser) && localDate.isAfter(minYearDate);
        }
        return false;
    }
}
