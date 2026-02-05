import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { PassportService } from '../_service/passport-service';
import { PasswordMatchValidator } from '../_helpers/password-match.validator';
import { PasswordValidator } from '../_helpers/password.validator';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private _routerService: Router = inject(Router)
  private _passportService: PassportService = inject(PassportService)
  errorFromServer = signal('')

  mode: 'login' | 'register' = 'login'
  form: FormGroup
  errorMessage = {
    username: signal(''),
    password: signal(''),
    confirm_password: signal(''),
    display_name: signal(''),
  }

  constructor() {
    this.form = this.createForm();
  }

  private createForm(): FormGroup {
    return new FormGroup({
      username: new FormControl(null, [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(16)
      ]),
      password: new FormControl(null, [
        Validators.required,
        Validators.maxLength(20)
      ])
    })
  }

  updateErrorMessage(ctrlName: string): void {
    const control = this.form.controls[ctrlName]
    if (!control) return

    switch (ctrlName) {
      case 'username':
        this.errorMessage.username.set(
          control.hasError('required') ? 'required' :
            control.hasError('minlength') ? 'must be at least 4 characters long' :
              control.hasError('maxlength') ? 'must be 16 characters or fewer' : ''
        )
        break;

      case 'password':
        if (control.hasError('required')) {
          this.errorMessage.password.set('required')
        } else if (this.mode === 'register') {
          // Complex validation only for Register
          if (control.hasError('invalidMinLength')) this.errorMessage.password.set('must be at least 8 characters long')
          else if (control.hasError('invalidMaxLength')) this.errorMessage.password.set('must be 20 characters or fewer')
          else if (control.hasError('invalidLowerCase')) this.errorMessage.password.set('must contain minimum of 1 lower-case letter [a-z].')
          else if (control.hasError('invalidUpperCase')) this.errorMessage.password.set('must contain minimum of 1 capital letter [A-Z].')
          else if (control.hasError('invalidNumeric')) this.errorMessage.password.set('must contain minimum of 1 numeric character [0-9].')
          else if (control.hasError('invalidSpecialChar')) this.errorMessage.password.set('must contain minimum of 1 special character: !@#$%^&*(),.?":{}|<>')
          else this.errorMessage.password.set('')
        } else {
          this.errorMessage.password.set('')
        }
        break;

      case 'confirm_password':
        this.errorMessage.confirm_password.set(
          control.hasError('required') ? 'required' :
            control.hasError('mismatch') ? 'do not match password' : ''
        )
        break;

      case 'display_name':
        this.errorMessage.display_name.set(control.hasError('required') ? 'required' : '')
        break;
    }
  }

  toggleMode(): void {
    this.mode = this.mode === 'login' ? 'register' : 'login'
    this.updateFormState()
  }

  private updateFormState(): void {
    const passwordControl = this.form.get('password');
    if (this.mode === 'register') {
      passwordControl?.setValidators([Validators.required, PasswordValidator(8, 20)]);
      this.form.addControl('confirm_password', new FormControl(null, [Validators.required]))
      this.form.addControl('display_name', new FormControl(null, [Validators.required]))
      this.form.addValidators(PasswordMatchValidator('password', 'confirm_password'))
    } else {
      passwordControl?.setValidators([Validators.required, Validators.maxLength(20)]);
      this.form.removeControl('confirm_password')
      this.form.removeControl('display_name')
      this.form.removeValidators(PasswordMatchValidator('password', 'confirm_password'))
    }
    passwordControl?.updateValueAndValidity();
    this.form.updateValueAndValidity();
    this.errorFromServer.set('');
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      const error = this.mode === 'login'
        ? await this._passportService.login(this.form.value)
        : await this._passportService.register(this.form.value);

      const errorMsg = typeof error === 'string' ? error : (error ? JSON.stringify(error) : '');
      this.errorFromServer.set(errorMsg);

      if (!this.errorFromServer()) {
        this._routerService.navigate(['/profile']);
      }
    } catch (e) {
      this.errorFromServer.set('Network disturbance detected. Connection lost.');
    }
  }
}