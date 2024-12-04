const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// middle ware

app.use(cors());
app.use(express.json());


// doctorUSer HxO1MrPRaGB9wbfB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.re9eo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const usersProfile = client.db('DoctorInfo').collection('users');
    const doctorService = client.db('DoctorInfo').collection('doctor');
    const bookinsProfile = client.db('DoctorInfo').collection('books');

    // jwt releted api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.DB_TOKEN, { expiresIn: '1h' });
      res.send({ token })
    })


    // middlewares
    const verifyToken = (req, res, next) => {
      console.log('inside the token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'forbidden access' })
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.DB_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
      })    
    }

    const veryfiedAdmin = async(req,res,next) => {
      const email = req.decoded.email;
      const query = {email: email};
      const user = await usersProfile.findOne(query);
      const isAdmin = user?.role === 'admin';
      if(!isAdmin){
        return res.status(403).send({message: 'forbidden access'})
      }
      next();
    }
    // user releted api
    app.get('/users', verifyToken, async (req, res) => {
      const result = await usersProfile.find().toArray();
      res.send(result)
    })

    app.get('/users/admin/:email', verifyToken,veryfiedAdmin, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'unauthorized access' })
      }
      const query = { email: email };
      const user = await usersProfile.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })

    app.post('/users', verifyToken, veryfiedAdmin, async (req, res) => {
      const user = req.body;
      const query = { email: user?.email }
      const existingUser = await usersProfile.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exist', insertedId: null })
      }
      const result = await usersProfile.insertOne(user);
      res.send(result);
    })

    app.delete('/users/:id',verifyToken, veryfiedAdmin, async (req, res) => {
      const user = req.params.id;
      const query = { _id: new ObjectId(user) }
      const result = await usersProfile.deleteOne(query);
      res.send(result)
    })

    app.patch('/users/admin/:id',verifyToken,veryfiedAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersProfile.updateOne(filter, updateDoc);
      res.send(result);

    })



    ///doctor about releted api
    app.get('/doctor', async (req, res) => {
      const cursor = await doctorService.find().toArray();
      res.send(cursor);
    })
    app.get('/doctor/:id', async (req, res) => {
      const user = req.params.id;
      const query = { _id: new ObjectId(user) }
      const result = await doctorService.findOne(query);
      res.send(result);

    })
    

    // appointment releted api
    app.post('/books', async (req, res) => {
      const user = req.body;
      const result = await bookinsProfile.insertOne(user);
      res.send(result)
    })

    // manage 
    app.get('/menage', verifyToken, veryfiedAdmin, async (req, res) => {
      try {
          const cursor = await doctorService.find().toArray(); // Retrieve all doctor data
          res.send(cursor); // Send the data back to the client
      } catch (error) {
          console.error('Error fetching doctors:', error);
          res.status(500).send({ error: 'Failed to fetch doctor data' });
      }
  });
  
  
    app.post('/manage',verifyToken, veryfiedAdmin, async(req,res) => {
      const item = req.body;
      const result = await doctorService.insertOne(item)
      res.send(result);
    })




    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('hello world')
})
app.listen(port, () => {
  console.log(`${port} Server Run Doctor`)
})