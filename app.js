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

async function createOpenAiCoursePlan() {
    try {
        // Fetching data of the logged-in student
        const studentDataResponse = await getLoggedInStudentData();
        const studentData = studentDataResponse.Student;

        // Fetching the course catalog
        const courseCatalogResponse = await fetch('/course_catalog');
        const courseCatalog = await courseCatalogResponse.json();

        // Function to extract prerequisites
        function extractPrerequisites(courseCatalog, courseCode) {
            const course = courseCatalog.find(c => c.course_name.startsWith(courseCode));
            return course?.description?.Prerequisite?.match(/CSE\s\d+/g) || [];
        }

        // Building a list of prerequisites for incomplete courses
        let prerequisites = "";
        const allIncompleteCourses = {...studentData.RemainingCourses.Required, ...studentData.RemainingCourses.Electives};
        Object.keys(allIncompleteCourses).forEach(courseCode => {
            const coursePrerequisites = extractPrerequisites(courseCatalog, courseCode);
            if (coursePrerequisites.length > 0) {
                prerequisites += `Course: ${courseCode}, Prerequisites: ${coursePrerequisites.join(', ')}\n`;
            }
        });

        // User preferences from a textbox (assuming you have a way to fetch this)
        const userPreferences = getUserPreferences(); // Function to get user preferences

        // Constructing the prompt
        const prompt = `
            Completed Courses: ${JSON.stringify(studentData.CompletedCourses)}
            Incomplete Courses: ${JSON.stringify(allIncompleteCourses)}
            Course Prerequisites: ${prerequisites}
            User Preferences: ${userPreferences}
            Based on the above information, generate an upcoming semester course list prioritizing courses that are prerequisites for future required courses in JSON format:
        `;

        // Send this prompt to OpenAI's API
        const openAiResponse = await fetch('https://api.openai.com/v1/engines/davinci/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer YOUR_OPENAI_API_KEY`
            },
            body: JSON.stringify({
                prompt: prompt,
                max_tokens: 150
            })
        });

        const completion = await openAiResponse.json();
        // Extract planned courses from the completion response
        // Assuming the completion response is in the desired JSON format
        const plannedCourses = JSON.parse(completion.choices[0].text);

        // Update the planned courses for the student in the database
        await updatePlannedCourses(studentId, plannedCourses);
    } catch (error) {
        console.error('There was an error:', error);
    }
}

async function getLoggedInStudentData(studentId) {
    try {
        const db = getDb();
        const students = db.collection("students");

        // Convert the studentId to ObjectId if it's passed as a string
        const query = { "_id": ObjectId(studentId) };
        const student = await students.findOne(query);

        return student;
    } catch (error) {
        console.error('Error fetching student data from MongoDB', error);
        throw error; // Rethrow the error for handling it outside this function
    }
}

async function updatePlannedCourses(studentId, plannedCourses) {
    try {
        const db = getDb();
        const students = db.collection("students");

        // Update the PlannedCourses field for the student
        const updateResult = await students.updateOne(
            { "_id": ObjectId(studentId) },
            { $set: { "Student.PlannedCourses.UpcomingSemester": plannedCourses } }
        );

        return updateResult;
    } catch (error) {
        console.error('Error updating planned courses in MongoDB', error);
        throw error;
    }
}
// Assuming 'getDb' is already imported or defined in your code

async function generateCourseSchedules(studentId, userInput) {
    const db = getDb();
    const students = db.collection("students");
    const courseCatalog = db.collection("course_catalog");

    try {
        // Fetch student's planned courses
        const student = await students.findOne({ "_id": ObjectId(studentId) });
        const plannedCourses = student.Student.PlannedCourses.UpcomingSemester;

        // Fetch course details
        const courseDetails = await Promise.all(plannedCourses.map(async (courseCode) => {
            return await courseCatalog.findOne({ "course_name": { $regex: new RegExp(courseCode) } });
        }));

        // Create prompt for OpenAI
        let prompt = `Create three semester plans for the following courses, maximizing professor rating, keeping classes scheduled together, and following these constraints: ${userInput}\n`;
        courseDetails.forEach(course => {
            prompt += `Course: ${course.course_name}, Meeting Times: ${course.sections.map(section => section['Time Slot']).join(', ')}, Professor Ratings: ${course.sections.map(section => section.Professor.Rating).join(', ')}\n`;
        });

        const openAiResponse = await fetch('https://api.openai.com/v1/engines/davinci/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer YOUR_OPENAI_API_KEY`
            },
            body: JSON.stringify({
                prompt: prompt,
                max_tokens: 250
            })
        });

        const completion = await openAiResponse.json();
        const plans = JSON.parse(completion.choices[0].text);

        // Update the student's planned schedule in the database
        await students.updateOne(
            { "_id": ObjectId(studentId) },
            { $set: { "Student.PlannedCourses.PlannedSchedule": plans } }
        );
    } catch (error) {
        console.error('Error:', error);
    }
}

// Example usage
// generateCourseSchedules("65b63abbcbcd46fb2736caa5", "Prefer morning classes").then(...);
