import { Component, inject, signal } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { NgxSpinnerComponent } from 'ngx-spinner';
import { ShadowCursorComponent } from './_components/shadow-cursor/shadow-cursor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, NgxSpinnerComponent, MatSnackBarModule, MatIconModule, MatTooltipModule, ShadowCursorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('GangBro-client');
}