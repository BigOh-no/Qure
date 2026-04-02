import { useEffect, useState } from "react";

const AuthCallback = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const handleGoogleCallback = async () => {
            try {
                const response = await fetch('/api/auth/google-callback', {credentials: 'include'});
                const userData = await response.json();
                setUser(userData);

                console.log('Logged in user: ', userData);
            } catch (err) {
                console.error('Error handing callback', err);
            }
        };

        handleGoogleCallback();
    }, []);

    if (!user) return <div>Logging in...</div>; //change later
    return <div>Wecome, {user.email}</div>; //change later
}

export default AuthCallback;