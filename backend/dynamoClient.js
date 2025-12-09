import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-north-1",
});

export const docClient = DynamoDBDocumentClient.from(client);
export const WATCHED_TABLE = process.env.WATCHED_TABLE || "WatchedMovies";
export const DEMO_USER_ID = "demo-user";
