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
  const { username, password, link } = req.body;

  if (!username || !password || !link) {
    res.status(400).json({ success: false, message: 'Faltan campos.' });
    return;
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Este usuario ya existe.' });
      return;
    }
    
    const result = await usersCollection.insertOne({ username, password, link });
    if (result.acknowledged) {
      res.json({ success: true, message: `Usuario '${username}' añadido con éxito.` });
    } else {
      res.status(500).json({ success: false, message: 'No se pudo añadir el usuario.' });
    }
    
  } catch (e) {
    console.error('Error en la función de añadir usuario:', e);
    // Este mensaje de error será más específico en la consola de Vercel
    res.status(500).json({ success: false, message: 'Error interno del servidor. Por favor, revisa los logs de Vercel.' });
  }
};
