import { Routes } from '@angular/router'
import { Home } from './home/home'
import { Login } from './login/login'
import { Profile } from './profile/profile'
import { ServerError } from './server-error/server-error'
import { NotFound } from './not-found/not-found'
import { authGuard } from './_guard/auth-guard'
import { Missions } from './missions/missions'
import { AboutMission } from './about-mission/about-mission'
import { AboutUs } from './about-us/about-us'


import { MyMissions } from './missions/my-missions/my-missions'

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'login', component: Login },
    { path: 'profile', component: Profile, canActivate: [authGuard], runGuardsAndResolvers: 'always' },
    { path: 'missions', component: Missions, canActivate: [authGuard], runGuardsAndResolvers: 'always' },
    { path: 'my-mission', component: MyMissions, canActivate: [authGuard] },
    { path: 'about-mission/:id', component: AboutMission, canActivate: [authGuard] },
    { path: 'about-us', component: AboutUs },

    // Integrated into Profile
    {
        path: 'setting',
        loadComponent: () => import('./setting/setting').then(c => c.Setting),
        canActivate: [authGuard]
    },
    { path: 'server-error', component: ServerError },
    { path: '**', component: NotFound },
]