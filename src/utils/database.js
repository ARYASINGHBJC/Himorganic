const fs = require('fs')
const path = require('path')
const config = require('../config')

// Generic JSON file database helper
class Database {
  constructor(filename) {
    this.filepath = path.join(config.dataDir, filename)
    this.ensureFile()
  }

  ensureFile() {
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true })
    }
    if (!fs.existsSync(this.filepath)) {
      fs.writeFileSync(this.filepath, '[]')
    }
  }

  read() {
    try {
      const data = fs.readFileSync(this.filepath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error(`Error reading ${this.filepath}:`, error)
      return []
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filepath, JSON.stringify(data, null, 2))
      return true
    } catch (error) {
      console.error(`Error writing ${this.filepath}:`, error)
      return false
    }
  }

  findById(id) {
    const data = this.read()
    return data.find(item => item.id === id)
  }

  findOne(predicate) {
    const data = this.read()
    return data.find(predicate)
  }

  findMany(predicate) {
    const data = this.read()
    return predicate ? data.filter(predicate) : data
  }

  create(item) {
    const data = this.read()
    data.push(item)
    this.write(data)
    return item
  }

  update(id, updates) {
    const data = this.read()
    const index = data.findIndex(item => item.id === id)
    if (index === -1) return null
    
    data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() }
    this.write(data)
    return data[index]
  }

  delete(id) {
    const data = this.read()
    const index = data.findIndex(item => item.id === id)
    if (index === -1) return false
    
    data.splice(index, 1)
    this.write(data)
    return true
  }
}

// Database instances
const databases = {
  users: new Database('users.json'),
  admins: new Database('admins.json'),
  products: new Database('products.json'),
  orders: new Database('orders.json'),
  analytics: new Database('analytics.json'),
  sessions: new Database('sessions.json')
}

module.exports = { Database, ...databases }