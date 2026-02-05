import { Passport } from "../_models/passport"

const _default_avatar = 'assets/def.jpg'
export function getAvatar(passport?: Passport) {
    if (passport?.avatar_url) {
        let url = passport.avatar_url;
        if (url.startsWith('http://')) {
            return url.replace('http://', 'https://');
        }
        return url;
    }
    return _default_avatar
}