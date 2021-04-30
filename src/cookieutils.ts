interface ICookieDetails {
    name: string;
    value: string;
    expires: string;
    domain: string;
}

// Code originally taken from : https://developers.livechatinc.com/blog/setting-cookies-to-subdomains-in-javascript/
export class Cookie {
    static set(name: string, value: string, expiration?: number) {
        var domain: string, domainParts: string[], date: any, expires: string, host: string;

        if (expiration) {
            date = new Date();
            date.setTime(date.getTime() + expiration);
            expires = '; expires=' + date.toGMTString();
        } else {
            expires = '';
        }

        host = location.hostname;
        if (host.indexOf('.') === -1) {
            // no "." in a domain - it's localhost or something similar
            document.cookie = name + '=' + value + expires + '; path=/';
        } else {
            // Remember the cookie on all subdomains.
            //
            // Start with trying to set cookie to the top domain.
            // (example: if user is on foo.com, try to set
            //  cookie to domain ".com")
            //
            // If the cookie will not be set, it means ".com"
            // is a top level domain and we need to
            // set the cookie to ".foo.com"
            domainParts = host.split('.');
            domainParts.shift();
            domain = '.' + domainParts.join('.');

            writeCookie({name, value, expires, domain});

            // check if cookie was successfuly set to the given domain
            // (otherwise it was a Top-Level Domain)
            if (Cookie.get(name) == null || Cookie.get(name) != value) {
                // append "." to current domain
                domain = '.' + host;
                writeCookie({name, value, expires, domain});
            }
        }
    }

    static get(name: string) {
        var cookiePrefix = name + '=';
        var cookieArray = document.cookie.split(';');
        for (var i = 0; i < cookieArray.length; i++) {
            var cookie = cookieArray[i];
            cookie = cookie.replace(/^\s+/, '');

            if (cookie.indexOf(cookiePrefix) == 0) {
                return cookie.substring(cookiePrefix.length, cookie.length);
            }
        }
        return null;
    }

    static erase(name: string) {
        Cookie.set(name, '', -1);
    }
}

function writeCookie(details: ICookieDetails) {
    const {name, value, expires, domain} = details;
    document.cookie = `${name}=${value}${expires}; path=/; domain=${domain}; SameSite=Lax`;
}
