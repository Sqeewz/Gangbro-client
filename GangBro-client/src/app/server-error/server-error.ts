import { Component, inject } from '@angular/core'
import { Router, RouterModule } from '@angular/router'

@Component({
  selector: 'app-server-error',
  imports: [RouterModule],
  templateUrl: './server-error.html',
  styleUrl: './server-error.scss',
})
export class ServerError {
  private _router = inject(Router)
  errorMsg: string | undefined | null = undefined

  constructor() {
    this.errorMsg = this._router.currentNavigation()?.extras.state?.['error'] as string
  }

  retry() {
    window.location.reload()
  }
}