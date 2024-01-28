const { MongoClient } = require('mongodb')

let dbConnection

let uri = 'mongodb+srv://bsyahputra:zepiXOUXzyAMWf2r@spartanscheduler.wvwq0rm.mongodb.net/?retryWrites=true&w=majority'

//how to export in Nodes application
module.exports = {
    connectToDb: (cb) =>{
        MongoClient.connect(uri)
          .then((client) => {
           dbConnection = client.db('course_catalog')
           return cb()
          })
          .catch(err => {
            console.log(err)
            return cb(err)
          })
    },
    getDb: () => dbConnection
}