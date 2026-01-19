import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import create from "connect-mongo";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import transporterRoutes from "./routes/transporterRoutes.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error: ",err));


const app = express();
const PORT = 4000;

app.set("view engine", "ejs");

app.use(express.json());

app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: new create({
      mongoUrl: process.env.MONGO_URI,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use(express.static("public"));

app.use("/", authRoutes);
app.use("/admin", adminRoutes);
app.use("/seller", sellerRoutes);
app.use("/user", userRoutes);
app.use("/transporter", transporterRoutes);

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/signup",(req,res)=>{
  res.render("signup")
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});