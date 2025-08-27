const express = require('express');
const app = express();
const port = 3000; // Esta línea no es necesaria para Vercel, pero puedes dejarla si quieres

// Middleware para procesar JSON
app.use(express.json());

// Objeto para simular la base de datos de usuarios
let userCredentials = {
    "545": {
        password: "rizos",
        link: "https://wayground.com/join?gc=56903938"
    },
    "usuario1": {
        password: "password1",
        link: "https://www.ejemplo1.com"
    }
};

// Ruta para añadir un nuevo usuario
app.post('/api/add-user', (req, res) => {
    const { username, password, link } = req.body;

    if (!username || !password || !link) {
        return res.status(400).json({ success: false, message: 'Faltan campos.' });
    }

    userCredentials[username] = { password, link };

    console.log(`Usuario '${username}' añadido. Credenciales actualizadas:`, userCredentials);

    res.json({ success: true, message: `Usuario '${username}' añadido con éxito.` });
});

// Ruta para manejar el inicio de sesión
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const adminUser = "1955";
    const adminPass = "Nirvauto00";
    if (username === adminUser && password === adminPass) {
        return res.json({ success: true, isAdmin: true });
    }

    if (userCredentials[username] && userCredentials[username].password === password) {
        const link = userCredentials[username].link;
        return res.json({ success: true, link });
    }

    res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });
});

// Exportar la app Express para Vercel
module.exports = app;