import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import resolvers from './graphql/resolver.js'

dotenv.config();

const app = express();

// Load GraphQL Schema from .graphql file
const typeDefs = fs.readFileSync(path.join('./graphql/schema.graphql'), 'utf-8');

// Setup Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('✅ Connected to MongoDB');

  // Start Apollo Server
  await server.start();
  server.applyMiddleware({ app });

  app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
}).catch((error) => {
  console.error('❌ MongoDB connection failed:', error);
});