package org.league.app.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(value = ElementType.FIELD)
@Retention(value = RetentionPolicy.RUNTIME)
@Constraint(validatedBy = EmailCustomValidator.class)
public @interface EmailСustom {

    String message() default "User has incorrect data";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
