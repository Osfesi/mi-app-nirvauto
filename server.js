const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para procesar JSON
app.use(express.json());

// URI de conexión a MongoDB, se obtiene de las variables de entorno de Vercel
const uri = process.env.MONGODB_URI;

let db;

// Conectar a MongoDB y luego iniciar el servidor
async function startServer() {
    if (!uri) {
        console.error("Error: La variable de entorno MONGODB_URI no está definida.");
        process.exit(1); 
    }
    const client = new MongoClient(uri);
    try {
        await client.connect();
        db = client.db("admin_db"); // El nombre de la base de la base de datos es admin_db
        console.log("Conectado a la base de datos de MongoDB y servidor iniciado.");

        // Iniciar el servidor SOLO después de conectar a la DB
        app.listen(PORT, () => {
            console.log(`Servidor escuchando en el puerto ${PORT}`);
        });

    } catch (e) {
        console.error("Error al conectar a la base de datos:", e.message);
        // Si no se puede conectar, salimos del proceso para evitar que la app corra sin DB
        process.exit(1);
    }
}

// Iniciar la aplicación
startServer();

// Ruta para añadir un nuevo usuario
app.post('/api/add-user', async (req, res) => {
    const { username, password, link } = req.body;

    if (!username || !password || !link) {
        return res.status(400).json({ success: false, message: 'Faltan campos.' });
    }

    if (!db) {
        // Esta comprobación ahora es redundante pero la mantenemos por seguridad
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
        // Esta comprobación es redundante pero la mantenemos por seguridad
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

// Exportar la app Express para Vercel
module.exports = app;
