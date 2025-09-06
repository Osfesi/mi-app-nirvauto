const { MongoClient } = require('mongodb');

// URI de conexión a MongoDB, se obtiene de las variables de entorno de Vercel
const uri = process.env.MONGODB_URI;

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  if (!uri) {
    throw new Error('La variable de entorno MONGODB_URI no está definida.');
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('admin_db');
    cachedDb = db;
    return db;
  } catch (e) {
    console.error('Error al conectar a la base de datos:', e.message);
    throw e;
  }
}

module.exports = async (req, res) => {
  const { username, password } = req.body;
  const adminUser = '1955';
  const adminPass = 'Nirvauto00';

  if (!username || !password) {
    res.status(400).json({ success: false, message: 'Faltan campos.' });
    return;
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    if (username === adminUser && password === adminPass) {
      res.json({ success: true, isAdmin: true });
    } else {
      const user = await usersCollection.findOne({ username, password });
      if (user) {
        const userLink = user.link;
        res.json({ success: true, link: userLink });
      } else {
        res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });
      }
    }
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};
