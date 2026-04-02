import createHandlder from 'azure-function-express'
import express from 'express'
import { verifyToken, requireRole, getGoogleOAuthUrl, handleGoogleUser } from './auth.js';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Hello");
});

app.get('/patient', verifyToken, (req, res) => {
    res.send(`Hello patient ${req.user.email}`);
});

app.get('/admin',verifyToken, requireRole('admin'), (req, res) => {
    res.send(`Hello admin ${req.user.email}`);
});

app.get('/clinicstaff',verifyToken, requireRole('clinic staff'), (req, res) => {
    res.send(`Hello staff ${req.user.email}`);
});

app.get('/auth/google-login', (req, res) =>{
    try{
        const url = getGoogleOAuthUrl();
        res.redirect(url);
    } catch (err){
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/auth/google-callback', async (req, res) =>{
    try {
        const user = await handleGoogleUser();
        if (!user) return res.status(401).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});    

export default createHandlder(app);
