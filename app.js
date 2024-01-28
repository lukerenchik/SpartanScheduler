const express = require('express')
const { connectToDb, getDb } = require('./db')
//init app & middleware
const app = express()

// db connection
connectToDb((err) => { // catch error if any
    if(!err){
        app.listen(3000, () =>{
            console.log('app listening on port 3000')
        })
        db = getDb()
    }
})


app.get('/course_catalog', (req, res)=> {
    let courses =[]

    db.collection('course_catalog')
     .find() //cursor toArray and forEach
     .sort({course_code: 1})
     .forEach(course => courses.push(course))
     .then(

    res.json({mssg: "welcome to the api"})
})

