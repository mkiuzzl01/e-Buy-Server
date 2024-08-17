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
    const database = client.db("e-Buy");
    const productCollection = database.collection("Products");
    const addCartCollection = database.collection("add-Cart");

    // =================Product Related Query========================
    app.get("/Products", async (req, res) => {
      const { search, filter, sort, page, size } = req.query;

      let filterObj = {};
      if (filter) {
        filterObj = JSON.parse(filter);
      }

      let query = {};

      if (search) {
        query.ProductName = { $regex: search, $options: "i" };
      }

      //products filtering
      if (filterObj.category) {
        query.Category = filterObj.category;
      }
      if (filterObj.brand) {
        query.BrandName = filterObj.brand;
      }
      if (filterObj.price) {
        const [min, max] = filterObj.price.split(" to ").map(Number);
        if (!isNaN(min) && !isNaN(max)) {
          query.Price = { $gte: min, $lte: max };
        } else {
          console.error("Invalid price range:", filterObj.price);
        }
      }

      // Sorting
      let sortQuery = {};
      if (sort === "Low to High") {
        sortQuery.Price = 1;
      } else if (sort === "High to Low") {
        sortQuery.Price = -1;
      } else if (sort === "Newest first") {
        sortQuery.CreationDate = -1;
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(size);
      const limit = parseInt(size);

      try {
        const cursor = productCollection
          .find(query)
          .sort(sortQuery)
          .skip(skip)
          .limit(limit);
        const products = await cursor.toArray();

        const totalDocuments = await productCollection.countDocuments(query);

        res.send({ data: products, totalDocuments });
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Server error");
      }
    });

    //Product Details
    app.get("/Product/:Id", async (req, res) => {
      const id = req.params.Id;
      const result = await productCollection.findOne({ Id: id });
      res.send(result);
    });

    //recent publish products
    app.get("/Recent-products", async (req, res) => {
      try {
        const recentProducts = await productCollection
          .find({})
          .sort({ CreationDate: -1 })
          .limit(4)
          .toArray();

        res.send(recentProducts);
      } catch (error) {
        console.error("Error fetching recent products:", error);
        res.status(500).send("Server error");
      }
    });

    //Trending Product
    app.get("/Trending-products", async (req, res) => {
      try {
        const recentProducts = await productCollection
          .find({})
          .sort({ Ratings: -1 })
          .limit(4)
          .toArray();

        res.send(recentProducts);
      } catch (error) {
        console.error("Error fetching recent products:", error);
        res.status(500).send("Server error");
      }
    });

    //add to cart api
    app.get('/Cart-product/:email',async(req,res)=>{
        const {email} = req.params;
        const result = await addCartCollection.find({userEmail:email}).toArray();
        res.send(result);
    })

    //=============Post related Api========================
    app.post("/add-cart", async (req, res) => {
      const info = req.body;
      const result = await addCartCollection.insertOne(info);
      res.send(result);
    });


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
