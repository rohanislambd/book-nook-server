import express from "express"


const app = express();
const PORT = 8000;








//http://localhost:8000
app.get('/', (req, res)=> {
    res.send({message: 'Server is runnig'})
})

app.listen(PORT, ()=>{
    console.log(`Server is runnig at ${PORT}`);
})