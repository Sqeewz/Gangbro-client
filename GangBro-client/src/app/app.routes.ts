import { Routes } from '@angular/router'
import { Home } from './home/home'
import { Login } from './login/login'
import { Profile } from './profile/profile'
import { ServerError } from './server-error/server-error'
import { NotFound } from './not-found/not-found'
import { authGuard } from './_guard/auth-guard'
import { Missions } from './missions/missions'


export const routes: Routes = [
    { path: '', component: Home },
    { path: 'login', component: Login },
    { path: 'profile', component: Profile, canActivate: [authGuard], runGuardsAndResolvers: 'always' },
    { path: 'missions', component: Missions, canActivate: [authGuard], runGuardsAndResolvers: 'always' },

    {
        path: 'my-missions',
        loadComponent: () => import('./missions/my-missions/my-missions').then(c => c.MyMissions),
        canActivate: [authGuard]
    },
    {
        path: 'mission-status',
        loadComponent: () => import('./missions/mission-status/mission-status').then(c => c.MissionStatus),
        canActivate: [authGuard]
    },
    { path: 'server-error', component: ServerError },
    { path: '**', component: NotFound },
]