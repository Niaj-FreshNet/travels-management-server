const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

app.use(express.json());

app.use(cors({
  origin: [
    'https://travels-management.web.app',
    'https://quickway2services.com',
    'http://localhost:5173'
  ]
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
    const userCollection = client.db('travelsDB').collection('users');



    // JWT related API to handle login and token generation
    app.post('/jwt', async (req, res) => {
      const { email } = req.body;  // Extract email from the request body

      try {
        // Fetch the user from the database using the email
        const user = await userCollection.findOne({ email });

        if (!user) {
          return res.status(404).send({ message: 'User not found' });
        }

        // Check if the user's account is active
        const status = user.status;
        if (status !== 'active') {
          return res.status(403).send({ message: 'Account is inactive' });
        }

        // Get the user's role from the database (sales/admin)
        const role = user.role;

        // Sign the JWT with both email, role, and status
        const token = jwt.sign(
          { email, role, status },  // Include email, role, and status in the JWT payload
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: '24h' }  // Token expires in 24 hours
        );

        // Send the JWT token back to the client
        res.send({ token });

      } catch (error) {
        console.error('Error generating JWT:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    // Middleware to verify the JWT and ensure the user has an active account
    const verifyToken = (req, res, next) => {
      const authorization = req.headers.authorization;

      if (!authorization) {
        return res.status(401).send({ message: 'Unauthorized access' });
      }

      const token = authorization.split(' ')[1];

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'Unauthorized access' });
        }

        // Attach the decoded token (which includes email, role, and status) to the request object
        req.decoded = decoded;

        // Check if the user's account is active
        if (req.decoded.status !== 'active') {
          return res.status(403).send({ message: 'Account is inactive' });
        }

        next();
      });
    };

    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      console.log('Admin Check:', email)
      const query = { email: email };
      console.log(query)
      const user = await userCollection.findOne(query);
      console.log(user)
      const isAdmin = user?.role === 'admin';
      console.log(isAdmin)
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access: NOT ADMIN' });
      }
      next();
    }



    // // ................................User Related API....................................
    // app.get('/users', verifyToken, async (req, res) => {
    //   const result = await userCollection.find().toArray();
    //   res.send(result);
    // });

    app.get('/users/status/:email', verifyToken, async (req, res) => {
      const email = req.params.email;

      // Ensure the email matches the one in the decoded token for security
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access: UNVERIFIED' });
      }

      try {
        // Find the user by email in the database
        const user = await userCollection.findOne({ email });
        if (!user) {
          return res.status(404).send({ message: 'User not found' });
        }

        // Return the user's status
        const isActive = user.status === 'active';
        res.send({ active: isActive });
      } catch (error) {
        console.error('Error fetching user status:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });


    app.get('/users/admin/:email', verifyToken, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access: UNVERIFIED' })
      }
      const query = { email: email };
      console.log(query);
      const user = await userCollection.findOne(query);
      console.log(user);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
        console.log(admin);
      }
      res.send({ admin });
    });

    // app.post('/users', async (req, res) => {
    //   const user = req.body;
    //   // insert email if user doesn't exists
    //   // you can do this many ways (1. email unique, 2. upsert, 3. simple checking)
    //   const query = { email: user.email }
    //   const existingUser = await userCollection.findOne(query);
    //   if (existingUser) {
    //     return res.send({ message: 'user already exists', insertedTd: null })
    //   }
    //   const result = await userCollection.insertOne(user);
    //   res.send(result);
    // });

    // app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) };
    //   const updatedDoc = {
    //     $set: {
    //       role: 'admin'
    //     }
    //   }
    //   const result = await userCollection.updateOne(filter, updatedDoc);
    //   res.send(result);
    // });

    // app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) }
    //   const result = await userCollection.deleteOne(query);
    //   res.send(result);
    // });



    // ................................User Related API....................................
    // Fetch all users
    app.get('/users', async (req, res) => {
      try {
        const cursor = userCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send({ error: 'Failed to fetch users' });
      }
    });

    // Fetch a single user by ID
    app.get('/user/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await userCollection.findOne({ _id: new ObjectId(id) });
        if (!result) {
          res.status(404).send({ error: 'User not found' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).send({ error: 'Failed to fetch user' });
      }
    });

    // Add a new user
    app.post('/user', verifyToken, verifyAdmin, async (req, res) => {
      try {
        const newUser = req.body;
        console.log('New user:', newUser);
        const result = await userCollection.insertOne(newUser);
        console.log('Insert result:', result);
        res.send(result);
      } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).send({ error: 'Failed to add user' });
      }
    });

    // Update an user's status
    app.patch('/user/:id/status', verifyToken, verifyAdmin, async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body;
        const result = await userCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );
        if (result.modifiedCount === 0) {
          res.status(404).send({ error: 'User not found or status unchanged' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).send({ error: 'Failed to update user status' });
      }
    });

    // Edit a user
    app.put('/user/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedUser = req.body;

        if (!updatedUser || Object.keys(updatedUser).length === 0) {
          return res.status(400).send({ error: 'No update data provided' });
        }

        const result = await userCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedUser }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ error: 'User not found' });
        }

        if (result.modifiedCount === 0) {
          return res.status(304).send({ message: 'No changes made to the user' });
        }

        const updatedUserData = await userCollection.findOne({ _id: new ObjectId(id) });
        res.send(updatedUserData);
      } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send({ error: 'Failed to update user' });
      }
    });

    // Delete an user
    app.delete('/user/:id', verifyToken, verifyAdmin, async (req, res) => {
      try {
        const id = req.params.id;
        const result = await userCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          res.status(404).send({ error: 'User not found' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send({ error: 'Failed to delete user' });
      }
    });




    // ................................Airline Related API....................................
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


    // Update supplier total due
    app.patch('/supplier/:supplierName', async (req, res) => {
      const { supplierName } = req.params;
      const { totalDue } = req.body;

      try {
        const updatedSupplier = await supplierCollection.findOneAndUpdate(
          { supplierName },
          { $set: { totalDue } },
          { new: true }
        );

        if (!updatedSupplier) {
          return res.status(404).json({ message: 'Supplier not found' });
        }

        res.json(updatedSupplier);
      } catch (error) {
        res.status(500).json({ message: 'Server error', error });
      }
    });




    // ................................Sale Related API....................................
    // Fetch sales (sales and admin role)
    app.get('/sales', verifyToken, async (req, res) => {
      try {
        const userEmail = req.decoded.email;  // Get user's email from the decoded JWT
        console.log('decoded email:', userEmail)
        const userRole = req.decoded.role;    // Get user's role from the decoded JWT
        console.log('decoded role:', userRole)

        let query = {};

        // If the user is a sales user, filter the sales by the createdBy field (their email)
        if (userRole === 'sales') {
          query.createdBy = userEmail;
          console.log('userEmail: ', userEmail)
        }
        // If the user is an admin, no need to filter, they can see all sales

        const sales = await saleCollection.find(query).toArray();
        console.log('sales query: ', sales)
        res.send(sales);

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

        // Find all sales that match the supplierName and have paymentStatus 'Paid' or 'Due'
        const result = await saleCollection.find({
          supplierName: supplierName,
          paymentStatus: { $in: ['Paid', 'Due'] }
        }).toArray();

        // Check if any results are found
        if (result.length === 0) {
          return res.status(404).send({ error: 'No results found for the supplier' });
        }

        // Send the sales back
        res.send(result);
      } catch (error) {
        console.error('Error fetching sale:', error);
        res.status(500).send({ error: 'Failed to fetch sale' });
      }
    });

    // .....................


    // Validate document number and get last RV number
    app.get('/validate-existing-sales', async (req, res) => {
      try {
        const { documentNumber } = req.query;

        if (!documentNumber) {
          return res.status(400).json({ error: 'Document number is required' });
        }

        // Check if the document number already exists
        const existingDocument = await saleCollection.findOne({ documentNumber });

        // Fetch the last stored RV number
        const lastSale = await saleCollection.find().sort({ createdAt: -1 }).limit(1).toArray(); // Assuming you have a timestamp field for sorting
        let lastRVNumber = null;

        if (lastSale.length > 0) {
          lastRVNumber = lastSale[0].rvNumber; // Assuming rvNumber is stored
        }

        // Format the next RV number
        const newRVNumber = lastRVNumber
          ? `RV-${String(parseInt(lastRVNumber.replace('RV-', ''), 10) + 1).padStart(4, '0')}`
          : 'RV-0001'; // Start from RV-0001 if no sales exist

        // Return the validation result and the last RV number
        return res.status(200).json({
          exists: !!existingDocument,
          message: existingDocument ? 'Document number already exists' : 'Document number is available',
          lastRVNumber: newRVNumber,
        });
      } catch (error) {
        console.error('Error validating document number:', error);
        res.status(500).json({ error: 'Error validating document number' });
      }
    });

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

    // Update a sale's post status by sale ID
    app.patch('/sale/:id/postStatus', async (req, res) => {
      try {
        const id = req.params.id;
        const { postStatus } = req.body; // Removed documentNumber since it's not needed

        // Ensure the id is a valid ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: 'Invalid sale ID' });
        }

        // Update the postStatus of the sale document directly
        const result = await saleCollection.updateOne(
          { _id: new ObjectId(id) }, // Find the sale by its unique ID
          { $set: { postStatus } } // Set the new postStatus
        );

        // Check if any document was modified
        if (result.modifiedCount === 0) {
          return res.status(404).send({ error: 'Sale not found or postStatus unchanged' });
        }

        // Successfully updated the post status
        res.send({ message: 'Post status updated successfully', result });
      } catch (error) {
        console.error('Error updating sale postStatus:', error);
        res.status(500).send({ error: 'Failed to update sale postStatus' });
      }
    });

    // Update a sale's post status (refund status) within a document by documentNumber
    app.patch('/sale/:id/refundStatus', async (req, res) => {
      try {
        const id = req.params.id;
        const { postStatus } = req.body;

        const result = await saleCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: { postStatus }
          }
        );

        if (result.modifiedCount > 0) {
          res.status(200).json({ message: 'Post status updated successfully' });
        } else {
          res.status(404).json({ message: 'No matching sale found to update' });
        }
      } catch (error) {
        console.error('Error updating post status:', error);
        res.status(500).json({ message: 'Error updating post status' });
      }
    });


    // Update a sale's payment status by sale ID
    app.patch('/sale/:id/paymentStatus', async (req, res) => {
      try {
        const id = req.params.id;
        const { paymentStatus } = req.body; // Removed documentNumber since it's not needed

        // Ensure the id is a valid ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: 'Invalid sale ID' });
        }

        // Update the paymentStatus of the sale document directly
        const result = await saleCollection.updateOne(
          { _id: new ObjectId(id) }, // Find the sale by its unique ID
          { $set: { paymentStatus } } // Set the new paymentStatus
        );

        // Check if any document was modified
        if (result.modifiedCount === 0) {
          return res.status(404).send({ error: 'Sale not found or paymentStatus unchanged' });
        }

        // Successfully updated the payment status
        res.send({ message: 'Payment status updated successfully', result });
      } catch (error) {
        console.error('Error updating sale paymentStatus:', error);
        res.status(500).send({ error: 'Failed to update sale paymentStatus' });
      }
    });

    // isRefund a sale
    app.patch('/sale/:id/isRefund', async (req, res) => {
      try {
        const id = req.params.id;
        const {
          refundCharge,
          serviceCharge,
          refundFromAirline,
          refundAmount,
          isRefunded,
          refundDate
        } = req.body;

        const result = await saleCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              refundDate,
              refundCharge,
              serviceCharge,
              refundFromAirline,
              refundAmount,
              isRefunded,
            },
          }
        );

        if (result.modifiedCount > 0) {
          res.status(200).json({ message: 'Sale updated successfully' });
        } else {
          res.status(404).json({ message: 'No matching sale found to update' });
        }
      } catch (error) {
        console.error('Error updating sale:', error);
        res.status(500).json({ message: 'Error updating sale' });
      }
    });

    // Edit a sale
    app.patch('/sale/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const {
          documentNumber,
          airlineCode,
          supplierName,
          sellPrice,
          buyingPrice,
          mode,
          remarks,
          passengerName,
          sector,
          date,
        } = req.body;

        console.log(req.body);

        const result = await saleCollection.updateOne(
          { _id: new ObjectId(id) }, // Match document by its _id
          {
            $set: {
              documentNumber,
              airlineCode,
              supplierName,
              sellPrice,
              buyingPrice,
              mode,
              remarks,
              passengerName,
              sector,
              date,
            },
          },
          { upsert: true } // This allows for inserting a new document if none is found
        );
        console.log(result);

        if (result.modifiedCount > 0) {
          res.status(200).json({ message: 'Sale updated successfully' });
        } else if (result.upsertedCount > 0) {
          res.status(201).json({ message: 'Sale created successfully' });
        } else {
          res.status(404).json({ message: 'No matching sale found to update' });
        }
      } catch (error) {
        console.error('Error updating sale:', error);
        res.status(500).json({ message: 'Error updating sale' });
      }
    });



    // notRefund a sale
    app.patch('/sale/:id/notRefund', async (req, res) => {
      try {
        const id = req.params.id;
        const { isRefunded } = req.body;

        const result = await saleCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { isRefunded } }
        );

        if (result.modifiedCount === 0) {
          res.status(404).send({ error: 'Sale not found or isRefunded unchanged' });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error('Error updating sale isRefunded:', error);
        res.status(500).send({ error: 'Failed to update sale isRefunded' });
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
