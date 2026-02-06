import { Passport } from "../_models/passport"

const _default_avatar = 'assets/def.jpg'
export function getAvatar(passport?: Passport) {
    if (passport?.avatar_url) {
        let url = passport.avatar_url;
        // Ensure HTTPS for all external URLs
        if (url.startsWith('http://')) {
            return url.replace('http://', 'https://');
        }
        // If it's a relative path or already https/data-uri, return as is
        return url;
    }
    return _default_avatar
}