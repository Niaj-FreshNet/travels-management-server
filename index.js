const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(express.json());

app.use(cors({
  origin: "https://travels-management.web.app"
}));


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kqlaj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const airlineCollection = client.db('travelsDB').collection('airlines');
    const supplierCollection = client.db('travelsDB').collection('suppliers');
    const saleCollection = client.db('travelsDB').collection('sales');
    const paymentCollection = client.db('travelsDB').collection('payments');



    // ................................Supplier Related API....................................
    // Fetch all airlines
    app.get('/airlines', async (req, res) => {
      try {
        const cursor = airlineCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error('Error fetching airlines:', error);
        res.status(500).send({ error: 'Failed to fetch airlines' });
      }
    });

    // Fetch a single airline by ID
    app.get('/airline/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await airlineCollection.findOne({ _id: new ObjectId(id) });
        if (!result) {
          res.status(404).send({ error: 'Airline not found' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error fetching airline:', error);
        res.status(500).send({ error: 'Failed to fetch airline' });
      }
    });

    // Add a new airline
    app.post('/airline', async (req, res) => {
      try {
        const newAirline = req.body;
        console.log('New airline:', newAirline);
        const result = await airlineCollection.insertOne(newAirline);
        console.log('Insert result:', result);
        res.send(result);
      } catch (error) {
        console.error('Error adding airline:', error);
        res.status(500).send({ error: 'Failed to add airline' });
      }
    });

    // Update an airline's status
    app.put('/airline/:id/status', async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body;
        const result = await airlineCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );
        if (result.modifiedCount === 0) {
          res.status(404).send({ error: 'Airline not found or status unchanged' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error updating airline status:', error);
        res.status(500).send({ error: 'Failed to update airline status' });
      }
    });

    // Edit an airline
    app.put('/airline/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedAirline = req.body;
        const result = await airlineCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedAirline }
        );
        if (result.modifiedCount === 0) {
          res.status(404).send({ error: 'Airline not found or data unchanged' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error updating airline:', error);
        res.status(500).send({ error: 'Failed to update airline' });
      }
    });

    // Delete an airline
    app.delete('/airline/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await airlineCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          res.status(404).send({ error: 'Airline not found' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error deleting airline:', error);
        res.status(500).send({ error: 'Failed to delete airline' });
      }
    });



    // ................................Supplier Related API....................................
    // Fetch all suppliers
    app.get('/suppliers', async (req, res) => {
      try {
        const cursor = supplierCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).send({ error: 'Failed to fetch suppliers' });
      }
    });

    // Fetch a single supplier by ID
    app.get('/supplier/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await supplierCollection.findOne({ _id: new ObjectId(id) });
        if (!result) {
          res.status(404).send({ error: 'Supplier not found' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error fetching supplier:', error);
        res.status(500).send({ error: 'Failed to fetch supplier' });
      }
    });

    // Add a new supplier
    app.post('/supplier', async (req, res) => {
      try {
        const newsupplier = req.body;
        console.log('New supplier:', newsupplier);
        const result = await supplierCollection.insertOne(newsupplier);
        console.log('Insert result:', result);
        res.send(result);
      } catch (error) {
        console.error('Error adding supplier:', error);
        res.status(500).send({ error: 'Failed to add supplier' });
      }
    });

    // Update an supplier's status
    app.put('/supplier/:id/status', async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body;
        const result = await supplierCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );
        if (result.modifiedCount === 0) {
          res.status(404).send({ error: 'Supplier not found or status unchanged' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error updating supplier status:', error);
        res.status(500).send({ error: 'Failed to update supplier status' });
      }
    });

    // Edit an supplier
    app.put('/supplier/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedsupplier = req.body;
        const result = await supplierCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedsupplier }
        );
        if (result.modifiedCount === 0) {
          res.status(404).send({ error: 'Supplier not found or data unchanged' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).send({ error: 'Failed to update airline' });
      }
    });

    // Delete an supplier
    app.delete('/supplier/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await supplierCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          res.status(404).send({ error: 'Supplier not found' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).send({ error: 'Failed to delete supplier' });
      }
    });



    // ................................Sale Related API....................................
    // Fetch all sale
    app.get('/sales', async (req, res) => {
      try {
        const cursor = saleCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).send({ error: 'Failed to fetch sales' });
      }
    });

    // Fetch a single sale by ID
    app.get('/sale/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await saleCollection.findOne({ _id: new ObjectId(id) });
        if (!result) {
          res.status(404).send({ error: 'Sale not found' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error fetching sale:', error);
        res.status(500).send({ error: 'Failed to fetch sale' });
      }
    });


    // ......................
    // Fetch payment status by supplierName from the sales collection
    app.get('/sale', async (req, res) => {
      try {
        const { supplierName } = req.query; // Get supplierName from the query parameters

        // Ensure supplierName is provided
        if (!supplierName) {
          return res.status(400).send({ error: 'Supplier name is required' });
        }

        // Find all sales that contain the supplierName in the sales array
        const result = await saleCollection.find({
          'sales.supplierName': supplierName,
          paymentStatus: { $in: ['Paid', 'Due'] }
        }).toArray();

        // Flatten the sales arrays and filter by supplierName
        const filteredSales = result.flatMap(sale =>
          sale.sales.filter(item => item.supplierName === supplierName)
        );

        // Check if any results are found
        if (filteredSales.length === 0) {
          return res.status(404).send({ error: 'No results found for the vendor' });
        }

        // Send the filtered sales back
        res.send(filteredSales);
      } catch (error) {
        console.error('Error fetching sale:', error);
        res.status(500).send({ error: 'Failed to fetch sale' });
      }
    });

    // .....................


    // Add a new sale
    app.post('/sale', async (req, res) => {
      try {
        const newSale = req.body;
        console.log('New sale:', newSale);
        const result = await saleCollection.insertOne(newSale);
        console.log('Insert result:', result);
        res.send(result);
      } catch (error) {
        console.error('Error adding sale:', error);
        res.status(500).send({ error: 'Failed to add sale' });
      }
    });

    // Update an sale's post status
    app.put('/sale/:id/postStatus', async (req, res) => {
      try {
        const id = req.params.id;
        const { postStatus } = req.body;
        const result = await saleCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { postStatus } }
        );
        if (result.modifiedCount === 0) {
          res.status(404).send({ error: 'Supplier not found or postStatus unchanged' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error updating sale postStatus:', error);
        res.status(500).send({ error: 'Failed to update sale postStatus' });
      }
    });


    // Update an sale's payment status
    app.put('/sale/:id/paymentStatus', async (req, res) => {
      try {
        const id = req.params.id;
        const { paymentStatus } = req.body;
        const result = await saleCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { paymentStatus } }
        );
        if (result.modifiedCount === 0) {
          res.status(404).send({ error: 'Supplier not found or paymentStatus unchanged' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error updating sale paymentStatus:', error);
        res.status(500).send({ error: 'Failed to update sale paymentStatus' });
      }
    });

    // Edit an sale
    app.put('/sale/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedSale = req.body;
        const result = await saleCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedSale }
        );
        if (result.modifiedCount === 0) {
          res.status(404).send({ error: 'Sale not found or data unchanged' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error updating sale:', error);
        res.status(500).send({ error: 'Failed to update sale' });
      }
    });

    // Delete an sale
    app.delete('/sale/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await saleCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          res.status(404).send({ error: 'Sale not found' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error deleting sale:', error);
        res.status(500).send({ error: 'Failed to delete sale' });
      }
    });



    // ................................Payment Related API....................................
    // Fetch all payment
    app.get('/payment', async (req, res) => {
      try {
        const cursor = paymentCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).send({ error: 'Failed to fetch payments' });
      }
    });

    // Fetch a single payment by ID
    app.get('/payment/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await paymentCollection.findOne({ _id: new ObjectId(id) });
        if (!result) {
          res.status(404).send({ error: 'Payment not found' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).send({ error: 'Failed to fetch payment' });
      }
    });

    // Add a new payment
    app.post('/payment', async (req, res) => {
      try {
        const newPayment = req.body;
        console.log('New payment:', newPayment);
        const result = await paymentCollection.insertOne(newPayment);
        console.log('Insert result:', result);
        res.send(result);
      } catch (error) {
        console.error('Error adding payment:', error);
        res.status(500).send({ error: 'Failed to add payment' });
      }
    });

    // Edit an payment
    app.put('/payment/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedPayment = req.body;
        const result = await paymentCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedPayment }
        );
        if (result.modifiedCount === 0) {
          res.status(404).send({ error: 'Payment not found or data unchanged' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).send({ error: 'Failed to update payment' });
      }
    });

    // Delete an payment
    app.delete('/payment/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await paymentCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          res.status(404).send({ error: 'Payment not found' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(500).send({ error: 'Failed to delete payment' });
      }
    });


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('FlyAid Admin is sitting');
});

app.listen(port, () => {
  console.log(`FlyAid Admin is sitting on port ${port}`);
});
