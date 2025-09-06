const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();

app.use(express.json());

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('Error: La variable de entorno MONGODB_URI no está definida.');
  process.exit(1);
}

// Variables para la conexión y la colección
let db;
let usersCollection;

// Función para conectar a la base de datos
async function connectToDatabase() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db('admin_db');
    usersCollection = db.collection('users');
    console.log('Conexión a MongoDB exitosa.');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1);
  }
}

// Conectar a la base de datos antes de iniciar el servidor
connectToDatabase();

// Ruta para añadir un nuevo usuario
app.post('/api/add-user', async (req, res) => {
  const { username, password, link } = req.body;

  if (!username || !password || !link) {
    return res.status(400).json({ success: false, message: 'Faltan campos.' });
  }

  try {
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'El usuario ya existe.' });
    }

    const newUser = { username, password, link };
    await usersCollection.insertOne(newUser);

    console.log(`Usuario '${username}' añadido a la base de datos.`);
    res.json({ success: true, message: `Usuario '${username}' añadido con éxito.` });
  } catch (error) {
    console.error('Error al añadir usuario:', error);
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

  try {
    const user = await usersCollection.findOne({ username });

    if (user && user.password === password) {
      return res.json({ success: true, isAdmin: false, link: user.link });
    }

    res.json({ success: false, message: 'Usuario o contraseña incorrectos.' });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// Sirve archivos estáticos (HTML, CSS, JS del frontend)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Puerto de escucha
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});