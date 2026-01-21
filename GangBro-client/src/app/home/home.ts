import { Component, inject } from '@angular/core';
import { PassportService } from '../_service/passport-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private _passport = inject(PassportService)

  constructor() {
  }
}