const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para procesar JSON
app.use(express.json());

// URI de conexión a MongoDB, se obtiene de las variables de entorno de Vercel
const uri = process.env.MONGODB_URI;

// Conectar a MongoDB
async function connectToDB() {
    if (!uri) {
        console.error("Error al conectar a la base de datos: La variable de entorno MONGODB_URI no está definida.");
        return null;
    }
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log("Conectado a la base de datos de MongoDB");
        return client.db("admin_db"); // El nombre de la base de datos es admin_db
    } catch (e) {
        console.error("Error al conectar a la base de datos:", e.message);
        return null;
    }
}

let db;
connectToDB().then(database => {
    db = database;
}).catch(console.error);

// Ruta para añadir un nuevo usuario
app.post('/api/add-user', async (req, res) => {
    const { username, password, link } = req.body;

    if (!username || !password || !link) {
        return res.status(400).json({ success: false, message: 'Faltan campos.' });
    }

    if (!db) {
        return res.status(500).json({ success: false, message: 'Error de conexión a la base de datos.' });
    }

    try {
        const usersCollection = db.collection('users');
        
        // 1. Verificar si el usuario ya existe
        const existingUser = await usersCollection.findOne({ username });

        if (existingUser) {
            // El usuario ya existe, no se puede añadir
            return res.status(409).json({ success: false, message: 'Este usuario ya existe.' });
        }

        // 2. Si el usuario no existe, añadir el nuevo
        const result = await usersCollection.insertOne({ username, password, link });

        if (result.acknowledged) {
            res.json({ success: true, message: `Usuario '${username}' añadido con éxito.` });
        } else {
            res.status(500).json({ success: false, message: 'No se pudo añadir el usuario.' });
        }

    } catch (e) {
        console.error("Error al añadir usuario:", e);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// Ruta para manejar el inicio de sesión
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const adminUser = "1955";
    const adminPass = "Nirvauto00";
    if (username === adminUser && password === adminPass) {
        return res.json({ success: true, isAdmin: true });
    }

    if (!db) {
        return res.status(500).json({ success: false, message: 'Error de conexión a la base de datos.' });
    }

    try {
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ username, password });

        if (user) {
            const link = user.link;
            return res.json({ success: true, link });
        } else {
            res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });
        }

    } catch (e) {
        console.error("Error al iniciar sesión:", e);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

// Exportar la app Express para Vercel
module.exports = app;