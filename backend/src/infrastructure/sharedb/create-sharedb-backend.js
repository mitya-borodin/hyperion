import * as json1 from "ot-json1";
import ShareDB from "sharedb";
import MongoMilestoneDB from "sharedb-milestone-mongo";
import ShareDBMongo from "sharedb-mongo";

ShareDB.types.register(json1.type);

export const createSharedbBackend = async (mongodbClient) => {
  const db = ShareDBMongo({
    mongo: (callback) => callback(undefined, mongodbClient),
    allowAllQueries: true,
  });

  const milestoneDb = new MongoMilestoneDB({
    mongo: (callback) => callback(undefined, mongodbClient),
  });

  return new ShareDB({ db, milestoneDb });
};
