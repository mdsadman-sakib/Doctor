const express = require('express');
const cors = require('cors');
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
    const doctorProfile = client.db('DoctorInfo').collection('users');
    const doctorService = client.db('DoctorInfo').collection('service');
    const bookinsProfile = client.db('bookings').collection('books');



    app.get('/users', async (req, res) => {
      const cursor = doctorProfile.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    app.get('/users/:id', async (req, res) => {
      const userId = req.params.id;
      const query = { _id: new ObjectId(userId) };
      const options = {
        projection: {
          name: 1,
          credentials: 1,
          rating: 1,
          location: 1,
          specialties: 1,
          about: 1,
          education: 1,
          awards: 1,
          services: 1,
          specializations: 1,
          businessHours: 1,
          image: 1,
          calendar: 1,
          title: 1,
        },
      };
      const result = await doctorProfile.findOne(query, options);
      res.send(result);
    })
    app.post('/users', async (req, res) => {
      const { name, email, specialty, photo } = req.body;
    
      const newDoctorProfile = {
        name,
        email,
        specialty,
        photo,
      };
      
      // Insert the new doctor profile into the collection
      const result = await doctorProfile.insertOne(newDoctorProfile);
    
      if (result.acknowledged) {
        res.status(201).json({
          message: 'Doctor profile added successfully',
          doctorProfile: newDoctorProfile,
        });
      } else {
        res.status(400).json({
          message: 'Failed to add doctor profile',
        });
      }
    });



    // book


    app.post('/books', async (req, res) => {
      try {
        const user = req.body; // Data from the frontend form submission
        if (!user) {
          return res.status(400).send({ message: 'No data provided' });
        }

        // Insert the user data (booking information) into the 'books' collection
        const response = await bookinsProfile.insertOne(user);

        // Send back the result
        res.send(response);
      } catch (error) {
        console.error('Error inserting booking:', error);
        res.status(500).send({
          message: 'Error inserting booking',
          error: error.message
        });
      }
    });





//service    


    app.get('/service', async (req, res) => {
      const cursor = doctorService.find();
      const result = await cursor.toArray();
      res.send(result);
    })


    app.get('/service/:id', async (req, res) => {
      const userId = req.params.id;
      const query = { _id: new ObjectId(userId) };
      const options = {
        projection: {
          name: 1,
          service: 1,
          time: 1,
        },
      };
      const result = await doctorService.findOne(query, options);
      res.send(result);
    })

    app.post('/service', async (req, res) => {
      const user = req.body;

      doctorService.insertOne(user)
        .then((response) => {
          res.status(201).send({
            success: true,
            message: "Service added successfully",
            data: response
          });
        })
        .catch((error) => {
          res.status(500).send({
            success: false,
            message: "Failed to add service",
            error: error.message
          });
        });
    });

    app.delete('/service/:id', async(req, res ) => {
      const user = req.params.id;
      console.log(user)
      const query = {_id: new ObjectId(user) }
      const responce = await doctorService.deleteOne(query);
      res.send(responce);
    })



    /// user
   



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