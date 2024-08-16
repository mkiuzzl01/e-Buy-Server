const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
require("dotenv").config();

const port = process.env.VITE_PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.VITE_DB_NAME}:${process.env.VITE_DB_PASS}@cluster0.rbychrh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //database and collections
    const database = client.db('e-Buy');
    const productCollection = database.collection('Products');


    //Product Related Query
    app.get('/Products',async(req,res)=>{
        const result = await productCollection.find().toArray();
        res.send(result);
    })





























  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }

  app.get("/", async (req, res) => {
    res.send("e-Buy server is running");
  });

  app.listen(port, () => {
    console.log("e-Buy Server Running in the port:", port);
  });
}
run().catch(console.dir);
