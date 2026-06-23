const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const articles = await db.collection("newsarticles").find({}).toArray();
    console.log("Articles:", articles.map(a => ({ id: a._id, title: a.title, slug: a.slug })));
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}
run();
