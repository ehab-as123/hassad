require("dotenv").config();

const express = require("express");
const morgan = require ("morgan");
const connectDb = require ("./utils/connectDb");
const errorMiddleware =require("./middlewares/errorMiddleware");
const notFound =require ("./middlewares/notFound");
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(morgan("dev"));

app.get("/api/health",(req,res)=>
{
    res.status(200).json({message:"hassad api is running"});
});
app.use("/api/auth",require('./routes/auth'));

app.use('/api/regions', require('./routes/region'));
app.use('/api/categories', require('./routes/category'));
app.use('/api/crops', require('./routes/crop'));
app.use('/api/supply-requests', require('./routes/supplyRequest'));
app.use('/api/offers', require('./routes/offer'));
app.use('/api/agreements', require('./routes/agreement'));

app.use(notFound);
app.use(errorMiddleware);

const start = async () => {
  try {
    await connectDb();

    const port = process.env.PORT || 27000;

    app.listen(port, () => {
      console.log(`Hassad API running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start the application:', error.message);
    process.exit(1);
  }
};

start();