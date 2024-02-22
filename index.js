const express = require('express');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;
const cors = require('cors');
var jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fzz1qah.mongodb.net/?retryWrites=true&w=majority`;

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        res.status(401).send({ "message": "unOthurized" })
    }
    jwt.verify(token, process.env.JWT_TOKEN_SECRET, (err, decode) => {
        if (err) {
            res.status(403).send({ "message": "token expired" })
        }
        req.user = decode
        next();
    })
}


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const dataBase = client.db("BabyToy");
        const userList = dataBase.collection("users");
        const toyList = dataBase.collection("toys");
        const toyCarts = dataBase.collection("toyCarts");


        app.put('/user', async (req, res) => {
            try {
                const filter = { email: req.body.email };
                const options = { upsert: true };
                const updateDoc = {
                    $set: req.body
                };
                const result = await userList.updateOne(filter, updateDoc, options);
                res.status(200).send(result)
            }
            catch (err) {
                res.status(402).send({ err: err.message })
            }
        })

        //get all top
        app.get('/toys/:type', async (req, res) => {
            try {
                const type = req.params.type;
                if (type == 'all') {
                    const result = await toyList.find().toArray();
                    return res.status(200).send(result)
                }
                const result = await toyList.find({ ageType: req.params.type }).toArray();
                res.status(200).send(result)
            }
            catch (err) {
                res.status(402).send({ err: err.message })
            }
        })

        // get specifiq toy details
        app.get('/toyDetails/:id', async (req, res) => {
            try {
                const result = await toyList.findOne({ _id: new ObjectId(req.params.id) })
                res.status(200).send(result)
            }
            catch (err) {
                res.status(402).send({ err: err.message })
            }
        })

        //post new toy
        app.post('/addToy', async (req, res) => {
            try {
                const result = await toyList.insertOne(req.body);
                res.status(200).send(result)
            }
            catch (err) {
                res.status(402).send({ err: err.message })
            }
        })

        //get toy with rating
        app.get('/getToyWithRating', async (req, res) => {
            try {
                const result = await toyList.find({rating : 5}).toArray();
                res.status(200).send(result)
            }
            catch (err) {
                res.status(402).send({ err: err.message })
            }
        })


         // update toy
        app.put('/updateToy', async (req, res) => {
            try {
                const filter = {_id : new ObjectId(req.body.id)}
                const updateDoc = {
                    $set: req.body,
                  };
                const result = await toyList.updateOne(filter, updateDoc);
                res.status(200).send(result)
            }
            catch (err) {
                res.status(402).send({ err: err.message })
            }
        })


        //add to cart by user
        app.post('/addCart', async (req, res) => {
            try {
                const result = await toyCarts.insertOne(req.body);
                res.status(200).send(result);
            }
            catch (err) {
                res.status(402).send({ err: err.message })
            }
        })

        //get cart toyss by specifiq user
        app.get('/toyCart/:email', async (req, res) => {
            try {
                const result = await toyCarts.find({ email: req.params.email }).toArray();
                res.status(200).send(result);
            }
            catch (err) {
                res.status(402).send({ err: err.message })
            }
        })

        // delete cart
        app.delete('/deleteCart/:id', async (req, res) => {
            try {
                const result = await toyCarts.deleteOne({ _id: req.params.id });
                res.status(200).send(result);
            }
            catch (err) {
                res.status(402).send({ err: err.message });
            }
        })

        // delete cart
        app.get('/myToy/:email', async (req, res) => {
            try {
                const result = await toyList.find({email : req.params.email}).toArray();
                res.status(200).send(result);
            }
            catch (err) {
                res.status(402).send({ err: err.message });
            }
        })


        //create jwt token
        app.put("/crtJwt", async (req, res) => {
            const token = jwt.sign(req.body, process.env.JWT_TOKEN_SECRET, { expiresIn: '24h' });
            res.cookie("token", token, {
                httpOnly: true,
                secure: false,
                // sameSite: 'none'
            }).send({ message: "token created success" })
        })


        //delete jwt token
        app.put("/dltJwt", async (req, res) => {
            res.clearCookie("token").send({ message: "token delete success" })
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.json({ message: 'Setup is ok.' })
})
app.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
})