/**
 * Database Adapter
 * 
 * Provides a unified interface for database operations.
 * Supports both MongoDB and JSON file storage.
 * 
 * Usage:
 *   const db = require('./dbAdapter')
 *   const user = await db.users.findById(id)
 *   const products = await db.products.findMany({ category: 'Fruits' })
 */

const config = require('../config')
const { User, Admin, Product, Order, Analytics, Session } = require('../models')

// JSON file database (fallback)
const jsonDb = require('./database')

/**
 * Check if using MongoDB
 */
const isUsingMongoDB = () => config.database.type === 'mongodb'

/**
 * Create a database adapter for a model
 */
const createAdapter = (MongoModel, jsonCollection) => {
  return {
    /**
     * Find by ID
     */
    async findById(id) {
      if (isUsingMongoDB()) {
        return await MongoModel.findById(id)
      }
      return jsonCollection.findById(id)
    },

    /**
     * Find one document matching criteria
     */
    async findOne(query) {
      if (isUsingMongoDB()) {
        return await MongoModel.findOne(query)
      }
      // Convert MongoDB-style query to predicate function
      return jsonCollection.findOne(item => {
        return Object.keys(query).every(key => item[key] === query[key])
      })
    },

    /**
     * Find many documents matching criteria
     */
    async findMany(query = {}, options = {}) {
      if (isUsingMongoDB()) {
        let mongoQuery = MongoModel.find(query)
        
        if (options.sort) mongoQuery = mongoQuery.sort(options.sort)
        if (options.limit) mongoQuery = mongoQuery.limit(options.limit)
        if (options.skip) mongoQuery = mongoQuery.skip(options.skip)
        if (options.populate) mongoQuery = mongoQuery.populate(options.populate)
        
        return await mongoQuery
      }
      
      let results = jsonCollection.findMany(item => {
        if (Object.keys(query).length === 0) return true
        return Object.keys(query).every(key => item[key] === query[key])
      })
      
      // Apply sorting for JSON
      if (options.sort) {
        const sortKey = Object.keys(options.sort)[0]
        const sortDir = options.sort[sortKey]
        results.sort((a, b) => {
          if (sortDir === -1 || sortDir === 'desc') {
            return b[sortKey] > a[sortKey] ? 1 : -1
          }
          return a[sortKey] > b[sortKey] ? 1 : -1
        })
      }
      
      // Apply pagination for JSON
      if (options.skip) results = results.slice(options.skip)
      if (options.limit) results = results.slice(0, options.limit)
      
      return results
    },

    /**
     * Create a new document
     */
    async create(data) {
      if (isUsingMongoDB()) {
        const doc = new MongoModel(data)
        return await doc.save()
      }
      
      // Add ID for JSON storage
      if (!data.id) {
        const { v4: uuidv4 } = require('uuid')
        data.id = uuidv4()
      }
      data.createdAt = new Date().toISOString()
      data.updatedAt = new Date().toISOString()
      
      return jsonCollection.create(data)
    },

    /**
     * Update a document by ID
     */
    async updateById(id, updates) {
      if (isUsingMongoDB()) {
        return await MongoModel.findByIdAndUpdate(
          id, 
          { $set: updates }, 
          { new: true, runValidators: true }
        )
      }
      return jsonCollection.update(id, updates)
    },

    /**
     * Update one document matching criteria
     */
    async updateOne(query, updates) {
      if (isUsingMongoDB()) {
        return await MongoModel.findOneAndUpdate(
          query,
          { $set: updates },
          { new: true, runValidators: true }
        )
      }
      
      const item = await this.findOne(query)
      if (!item) return null
      return jsonCollection.update(item.id, updates)
    },

    /**
     * Delete a document by ID
     */
    async deleteById(id) {
      if (isUsingMongoDB()) {
        return await MongoModel.findByIdAndDelete(id)
      }
      return jsonCollection.delete(id)
    },

    /**
     * Delete one document matching criteria
     */
    async deleteOne(query) {
      if (isUsingMongoDB()) {
        return await MongoModel.findOneAndDelete(query)
      }
      
      const item = await this.findOne(query)
      if (!item) return null
      return jsonCollection.delete(item.id)
    },

    /**
     * Count documents matching criteria
     */
    async count(query = {}) {
      if (isUsingMongoDB()) {
        return await MongoModel.countDocuments(query)
      }
      
      const items = await this.findMany(query)
      return items.length
    },

    /**
     * Check if document exists
     */
    async exists(query) {
      if (isUsingMongoDB()) {
        return await MongoModel.exists(query)
      }
      
      const item = await this.findOne(query)
      return !!item
    },

    /**
     * Get the raw model (for complex operations)
     */
    getModel() {
      return isUsingMongoDB() ? MongoModel : jsonCollection
    }
  }
}

// Create adapters for each collection
const db = {
  users: createAdapter(User, jsonDb.users),
  admins: createAdapter(Admin, jsonDb.admins),
  products: createAdapter(Product, jsonDb.products),
  orders: createAdapter(Order, jsonDb.orders),
  analytics: createAdapter(Analytics, jsonDb.analytics),
  sessions: createAdapter(Session, jsonDb.sessions),
  
  // Utility
  isUsingMongoDB
}

module.exports = db