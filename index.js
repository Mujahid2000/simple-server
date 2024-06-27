const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5050;



// middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mujahid.frqpuda.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
  // collection data 

async function run() {
  try {
    const subscribeCollection = client.db("Fitness_server").collection("subscribe");
    const galleryCollection = client.db("Fitness_server").collection("Gallery");
    const trainerCollection = client.db("Fitness_server").collection("Trainer");
    const trainerApplyCollection = client.db("Fitness_server").collection("TrainerApply");
    const trainerBookingCollection = client.db("Fitness_server").collection("TrainerBooking");
    const forumCollection = client.db("Fitness_server").collection("Forum");
    const voteCollection = client.db("Fitness_server").collection("vote");
    const classCollection = client.db("Fitness_server").collection("Class");
    const paymentCollection = client.db("Fitness_server").collection("Payment");
    const usersCollection = client.db("Fitness_server").collection("Users");
    

    // Connect the client to the server	(optional starting in v4.7)
    

    const paymentHistory = [];


    // jwt--- the mother of all problems
  
  app.post('/jwt', async(req, res) =>{
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '5h'})
    res.send({token})
  })

  // middlewares
  const verifyToken = (req, res, next) =>{
    console.log('inside verify toke ',req.headers.authorization);
    if(!req.headers.authorization){
      return res.status(401).send({message: 'unauthorized access'})
    }
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
      if(err){
        return res.status(401).send({message: 'unauthorized access'})
      }
      req.decoded = decoded;
      next();
    })
  }



  // verify admin check
  const verifyAdmin = async (req, res, next) =>{
    const email = req.decoded.email;
    const query = {email: email};
    const user = await usersCollection.findOne(query);
    const isAdmin = user?.role === 'admin';
    if(!isAdmin){
      return res.status(403).send({message: 'forbidden access'})
    }
    next();
  }

  // verify Trainer check
  app.get('/users/trainer/:email', verifyToken, async(req, res) =>{
    const email = req.params.email;
    if(email !== req.decoded.email) {
      return res.status(403).send({message: 'forbidden access'})
    }
    const query = {email: email};
    const user = await trainerCollection.findOne(query);
    let trainer = false;
    if(user){
      trainer = user?.role === 'trainer';
      res.send({trainer})
    }
  })


    app.post('/subscribe', async (req, res) =>{
        const user = req.body;
        console.log(user);
        const result = await subscribeCollection.insertOne(user);
        res.send(result);
    })

    app.get('/subscribe', async(req, res) =>{
        const result = await subscribeCollection.find().toArray();
        res.send(result);
    })

    app.get('/gallery', async(req, res) =>{
        const result = await galleryCollection.find().toArray();
        res.send(result);
    })

    // trainer related api

    app.get('/trainer', async(req, res) =>{
      const result = await trainerCollection.find().toArray();
      res.send(result);
    })

    app.get('/trainer/:id', async(req, res) =>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)}
      const result = await trainerCollection.findOne(filter);
      res.send(result);
    })

    app.get('/trainer/:name', async(req, res) =>{
      const name = req.params.name;
      const filter = {name: name};
      const result = await trainerCollection.findOne(filter);
      res.send(result);
    })

    app.post('/trainerApply', async(req, res) =>{
      const user = req.body;
      const result = await trainerApplyCollection.insertOne(user);
      res.send(result);
    })

    app.get('/trainerApply', async(req, res) =>{
      const result = await trainerApplyCollection.find().toArray();
      res.send(result);
    })

    // class api code 

    app.get('/weeklySchedule', async(req, res) =>{
      const result = await classCollection.find().toArray();
      res.send(result);
    })

    app.post('/weeklySchedule', async(req, res) =>{
      const user = req.body;
      const result = await classCollection.insertOne(user);
      res.send(result);
    })

    // trainer api code 

    app.patch('/trainerApply/:Id', async(req, res) =>{
      try {
        const id = req.params.Id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: { role: "trainer" },
      
        };
        const trainer = await trainerApplyCollection.findOne(filter)
        trainer.role = "trainer";
        delete trainer._id
        const result = await trainerCollection.insertOne(trainer)
        const deleted = await trainerApplyCollection.deleteOne(filter);
        
        res.send(result);
        
      } catch (error) {
        res
        .status(500)
        .send({error: true, message: "server side error"});
      }       
    })
    
    app.post('/trainerBooked', async(req, res) =>{
      const user = req.body;
      const result = await trainerBookingCollection.insertOne(user);
      res.send(result);
    })
    
    app.get('/trainerBooked', async(req, res) =>{
      const result = await trainerBookingCollection.find().toArray();
      res.send(result);
    })
    
    

    app.get('/trainerBooked/:trainerName', async(req,res) =>{
      const trainerName = req.params.trainerName;
      console.log(trainerName);
      const filter = { trainerName :  trainerName};
      const result = await trainerBookingCollection.find(filter).toArray();
      res.send(result)
    })

// complete 

    app.post("/updateVotes", async (req, res) => {
      const data = req.body;
      const find = await voteCollection.findOne({
        forumId: data.forumId,
        userId: data.userId
      });
      if (!find) {
        const result = await voteCollection.insertOne(data);
        res.send(result);
      } else {
        const result = await voteCollection.updateOne({
          forumId: data.forumId,
          userId: data.userId
        }, { $set:
          {
            status: data.status
          }
        },);
        res.send(result);
      }
    });



    app.get('/updateVotes', async(req, res) =>{
      const result = await voteCollection.find().toArray();
      res.send(result);
    })


    app.get("/forum", async (req, res) => {
      const result = await forumCollection.find().toArray();
      const countVote = await voteCollection
        .aggregate([
          {
            $group: {
              _id: "$forumId",
              count: { $sum: 1 }
            }
          }
        ])
        .toArray();
    
      
      res.send({
        forum: result,
        voteList: countVote
      });
    });


    // payment intent
    app.post('/create-payment-intent', async (req, res) => {
      try {
          const { price, trainerId } = req.body;
          const amount = parseInt(price * 100);
          const userId = trainerId
          console.log(trainerId); 
        
          const lastPayment = paymentHistory.find(payment => {
              return (
                  payment.userId === userId &&
                  new Date(payment.timestamp).getMonth() === new Date().getMonth()
              );
          });
  
          if (lastPayment) {
              // User has already made a payment in the current month
              return res.status(400).send({ error: 'User has already made a payment this month' });
          }
  
          const paymentIntent = await stripe.paymentIntents.create({
              amount: amount,
              currency: 'usd',
              payment_method_types: ['card']
          });
  
          
          paymentHistory.push({
              userId: userId,
              timestamp: new Date().toISOString(),
              amount: amount
          });
  
          res.send({
              clientSecret: paymentIntent.client_secret
          });
      } catch (error) {
          console.error('Error creating payment intent:', error);
          res.status(500).send({ error: 'Error creating payment intent' });
      }
  });


  // payment collection
  app.post('/payments', async(req, res) =>{
    const payment = req.body;
    const paymentResult = await paymentCollection.insertOne(payment)
    res.send(paymentResult);
  })

  app.get('/payments', async(req,res) =>{
    const result = await paymentCollection.find().toArray();
    res.send(result)
  });

  
  
  // user operation
    app.post('/users', async(req, res) =>{
      const user = req.body;
      const filter = {email: user.email}
      const existingUser = await usersCollection.findOne(filter)
      if(existingUser){
        return res.send({message: "user already exist", insertedId: null})
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })

    app.get('/users', verifyToken, verifyAdmin, async(req, res) =>{
      const result = await usersCollection.find().toArray();
      res.send(result);
    })

    

    app.get('/users/admin/:email', verifyToken, async(req, res) =>{
      const email = req.params.email;
      if(email !== req.decoded.email) {
        return res.status(403).send({message: 'forbidden access'})
      }
      const query = {email: email};
      const user = await usersCollection.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role === 'admin';
        res.send({admin})
      }
    })



    
    app.patch('/users/update/:email', verifyToken, async (req, res) => {
      const result = await usersCollection.updateOne({
        email: req.params.email
      }, {
        $set: {
          name: req.body.name
        }
      })
      res.send(result);
    })


    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async(req, res) =>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    
  }
}
run().catch(console.dir);


app.get('/', (req , res) =>{
    res.send('Fitness Server is Running')
})

app.listen(port, () =>{
    console.log(`Fitness server running on the port ${port}`);
})