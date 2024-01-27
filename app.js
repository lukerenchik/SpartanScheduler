const express = require('express')

//init app & middleware

const app = express()

app.listen(3030, () =>{
    console.log('app listening on port 3000')
})

//routes
app.get('/resourceNeedToBeHandle', (req, res)=>{
    res.json({mssg: "welcome to the api"})
})
