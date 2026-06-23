const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env.local") });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const articles = await db.collection("newsarticles").find({}).toArray();
    for (const a of articles) {
      if (a.slug.trim() !== a.slug) {
        await db.collection("newsarticles").updateOne({ _id: a._id }, { $set: { slug: a.slug.trim() } });
        console.log("Fixed:", a.slug);
      }
    }
    console.log("Done");
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}
run();
