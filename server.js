const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local").Strategy;

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection details
const mongoURI = "mongodb+srv://jnprudhivi:db_pass@cluster0.tjtqz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "taskDB";

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// Set up session middleware
app.use(session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

let db, usersCollection, tasksCollection;

// Connect to MongoDB
MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        db = client.db(dbName);
        usersCollection = db.collection("users"); // User collection
        tasksCollection = db.collection("tasks"); // Task collection
        console.log("Connected to MongoDB Atlas");
    })
    .catch(error => console.error("MongoDB connection error:", error));

// Passport user serialization
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await usersCollection.findOne({ _id: new ObjectId(id) });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Passport Local Strategy for login
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await usersCollection.findOne({ username });
        if (!user) return done(null, false, { message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return done(null, false, { message: "Incorrect password" });

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

app.get("/auth-status", (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ authenticated: true, user: req.user });
    } else {
        res.json({ authenticated: false });
    }
});

// Register new user
app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: "Username and password required" });

        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) return res.status(400).json({ error: "Username already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await usersCollection.insertOne({ username, password: hashedPassword });

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error registering user" });
    }
});

// Login route
app.post("/login", passport.authenticate("local"), (req, res) => {
    res.json({ message: "Login successful", user: req.user });
});

// Logout route
app.post("/logout", (req, res) => {
    req.logout(err => {
        if (err) return res.status(500).json({ error: "Logout failed" });
        res.json({ message: "Logged out successfully" });
    });
});

// Middleware to check if user is authenticated
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: "Unauthorized" });
};

// Get tasks for the logged-in user
app.get("/tasks", ensureAuthenticated, async (req, res) => {
    try {
        const tasks = await tasksCollection.find({ userId: req.user._id.toString() }).toArray();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: "Error fetching tasks" });
    }
});

// Add task for logged-in user
app.post("/tasks", ensureAuthenticated, async (req, res) => {
    try {
        const task = { ...req.body, userId: req.user._id.toString() };
        await tasksCollection.insertOne(task);
        res.json(await tasksCollection.find({ userId: req.user._id.toString() }).toArray());
    } catch (error) {
        res.status(500).json({ error: "Error adding task" });
    }
});

// Update task (only if owned by the logged-in user)
app.put("/tasks/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedTask = req.body;
        const result = await tasksCollection.updateOne(
            { _id: new ObjectId(id), userId: req.user._id.toString() },
            { $set: updatedTask }
        );

        if (result.matchedCount === 0) return res.status(403).json({ error: "Not authorized to edit this task" });

        res.json(await tasksCollection.find({ userId: req.user._id.toString() }).toArray());
    } catch (error) {
        res.status(500).json({ error: "Error updating task" });
    }
});

// Delete task (only if owned by the logged-in user)
app.delete("/tasks/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await tasksCollection.deleteOne({ _id: new ObjectId(id), userId: req.user._id.toString() });

        if (result.deletedCount === 0) return res.status(403).json({ error: "Not authorized to delete this task" });

        res.json(await tasksCollection.find({ userId: req.user._id.toString() }).toArray());
    } catch (error) {
        res.status(500).json({ error: "Error deleting task" });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

