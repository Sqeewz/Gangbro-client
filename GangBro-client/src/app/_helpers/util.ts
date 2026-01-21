import { Passport } from "../_models/passport"


const _default_avatar = '/assets/de.avatar.jpg'
export function getAvatar(passport?: Passport) {
    if (passport?.avatar_url) return passport.avatar_url
    return _default_avatar
}