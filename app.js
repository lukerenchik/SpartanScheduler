const express = require('express')
const { connectToDb, getDb } = require('./db')

//init app & middleware
const app = express()
app.use(express.json())

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
    const db = getDb();
    db.collection('SpartanScheduler')
     .find() //cursor toArray and forEach
     .sort({course_code: 1})
     .toArray()
     .then(courses => {
        console.log(courses);
        res.status(200).json(courses);
     })
     .catch(() => {
        res.status(500).json({error: 'Could not fetch the documents'})
     })
})

app.get('/Students', (req, res) => {
    const db = getDb();
    db.collection('Students')
      .find()
      .toArray()
      .then(items => {
          res.status(200).json(items);
      })
      .catch(err => {
          console.error(err);
          res.status(500).json({error: 'Could not fetch the documents from Students'});
      });
});

app.get('/StudyTracks', (req, res) => {
    const db = getDb();
    db.collection('StudyTracks')
      .find()
      .toArray()
      .then(items => {
          res.status(200).json(items);
      })
      .catch(err => {
          console.error(err);
          res.status(500).json({error: 'Could not fetch the documents from Students'});
      });
});

app.post('/Students', (req, res) => {
    const studentCourseList = req.body

    db.collection('Students')
    .insertOne(studentCourseList)
    .then(result => {
        res.status(201).json(result)
    })
    .catch(err => {
        res.status(500).json({
            err: 'Could not create a new document'
        })
    })

    
})
