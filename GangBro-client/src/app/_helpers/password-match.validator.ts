import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function PasswordMatchValidator(
    ctrl_password_name: string,
    ctrl_confirm_password_name: string
): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
        const ctrlPassword = formGroup.get(ctrl_password_name)
        const ctrlConfirmPassword = formGroup.get(ctrl_confirm_password_name)
        if (!ctrlPassword || !ctrlConfirmPassword) return null
        if (ctrlPassword.value !== ctrlConfirmPassword.value)
            setTimeout(() => ctrlConfirmPassword.setErrors({ mismatch: true }), 0)
        else setTimeout(() => ctrlConfirmPassword.setErrors(null), 0)
        return null
    }
}