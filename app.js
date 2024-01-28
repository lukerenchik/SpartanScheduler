const express = require('express')
const { ObjectId } = require('mongodb')
const { connectToDb, getDb } = require('./db')
const { auth } = require('express-openid-connect');


//init app & middleware
const app = express()
app.use(express.json())

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET, // store this in an environment variable
    baseURL: 'http://localhost:3001', // change this to your production URL in production
    clientID: 'your_auth0_client_id',
    issuerBaseURL: 'https://your_auth0_domain'
  };

  app.use(auth(config));

// db connection
connectToDb((err) => { // catch error if any
    if(!err){
        app.listen(3001, () =>{
            console.log('app listening on port 3001')
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

app.get('/course_catalog/:id', (req,res) => {
    const db = getDb()
    if(ObjectId.isValid(req.params.id)){
        db.collection('SpartanScheduler')
        .findOne({_id: new ObjectId(req.params.id)})
        .then(doc => {
            res.status(200).json(doc)
        })
        .catch(err => {
            res.status(500).json({error:'Could not fetch the document'
            })
        })
    } else {
        res.status(500).json({error: 'Not a valid doc id'})
    }
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

app.post('/Students/:studentId/addCourse', (req, res) => {
    const db = getDb();
    const studentId = req.params.studentId;
    const courseToAdd = req.body; // Assuming this is the course object to add

    if (!ObjectId.isValid(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
    }

    db.collection('Students')
        .updateOne(
            { _id: new ObjectId(studentId) },
            { $push: { plannedCourse: courseToAdd } } // Adding the course to plannedCourse array
        )
        .then(result => {
            if (result.modifiedCount === 0) {
                return res.status(404).json({ error: 'Student not found or no update made' });
            }
            res.status(200).json({ message: 'Course added to planned courses' });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Could not update the student document' });
        });
});


app.delete('/students/:studentId/courses/:courseId', (req, res) => {
    const db = getDb();
    const studentId = req.params.studentId;
    const courseId = req.params.courseId;

    if (!ObjectId.isValid(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
    }

    db.collection('Students')
        .updateOne(
            { _id: new ObjectId(studentId) },
            { $pull: { plannedCourse: courseId } } // Assuming courseId is directly the value in the array
        )
        .then(result => {
            if (result.modifiedCount === 0) {
                return res.status(404).json({ error: 'No such course found in student planned courses' });
            }
            res.status(200).json({ message: 'Course removed from planned courses' });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Could not update the document' });
        });
})