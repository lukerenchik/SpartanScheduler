const { MongoClient } = require('mongodb')

let dbConnection

//how to export in Nodes application
module.exports = {
    connectToDb: (cb) =>{
        MongoClient.connect('mongdodb://localhost:3000/course_catalog')
          .then((client) => {
           dbConnection = client.db()
           return cb()
          })
          .catch(err => {
            console.log(err)
            return cb(err)
          })
    },
    getDb: () => dbConnection
}