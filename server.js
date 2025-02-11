const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// MongoDB Atlas connection details
const mongoURI = "mongodb+srv://jnprudhivi:db_pass@cluster0.tjtqz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "taskDB"; // Database name
const collectionName = "tasks"; // Collection name

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

let db, tasksCollection;

// Connect to MongoDB Atlas
MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        db = client.db(dbName);
        tasksCollection = db.collection(collectionName);
        console.log("Connected to MongoDB Atlas");
    })
    .catch(error => console.error("MongoDB connection error:", error));

// Get all tasks
app.get("/tasks", async (req, res) => {
    try {
        const tasks = await tasksCollection.find().toArray();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: "Error fetching tasks" });
    }
});

// Add a new task
app.post("/tasks", async (req, res) => {
    try {
        const task = req.body;
        await tasksCollection.insertOne(task);
        const tasks = await tasksCollection.find().toArray();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: "Error adding task" });
    }
});

// Update a task
app.put("/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updatedTask = req.body;
        await tasksCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedTask });
        const tasks = await tasksCollection.find().toArray();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: "Error updating task" });
    }
});

// Delete a task
app.delete("/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await tasksCollection.deleteOne({ _id: new ObjectId(id) });
        const tasks = await tasksCollection.find().toArray();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: "Error deleting task" });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
