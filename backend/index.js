import express from "express"

const app = express();

const port = 4000;

app.get('/',(req,res)=>{
    res.send("HELLO FORM SERVER");
})

app.listen(port,(req,res)=>{
    console.log(`server running on port ${port}`);
})