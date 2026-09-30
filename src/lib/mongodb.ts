import { Db, MongoClient } from "mongodb";

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGO_DB;
  if (!uri) throw new Error("MONGO_DB environment variable is not set");
  return new MongoClient(uri).connect();
}

export function getMongoDb(): Promise<Db> {
  if (!global.__mongoClientPromise) {
    global.__mongoClientPromise = createClientPromise();
  }
  return global.__mongoClientPromise.then((client) => client.db("chop_africana"));
}
