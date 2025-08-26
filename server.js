const express = require('express');
const app = express();
const port = 3000;

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

    // Guardar el nuevo usuario en el objeto
    // En un entorno real, aquí guardarías en una base de datos
    userCredentials[username] = { password, link };

    console.log(`Usuario '${username}' añadido. Credenciales actualizadas:`, userCredentials);

    res.json({ success: true, message: `Usuario '${username}' añadido con éxito.` });
});

// Ruta para manejar el inicio de sesión
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Verificar credenciales del administrador (si no quieres que estén en el cliente)
    const adminUser = "1955";
    const adminPass = "Nirvauto00";
    if (username === adminUser && password === adminPass) {
        return res.json({ success: true, isAdmin: true });
    }

    // Verificar credenciales de usuarios normales
    if (userCredentials[username] && userCredentials[username].password === password) {
        const link = userCredentials[username].link;
        return res.json({ success: true, link });
    }

    res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });
});

// Servir archivos estáticos (como tu index.html)
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});