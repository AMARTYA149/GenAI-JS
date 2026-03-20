import express from 'express';
import { generate } from './chatbot.js';
import cors from 'cors';

const app = express()
const port = 3001
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to ChatDPT!')
});

app.post('/chat', async (req, res)=>{
    const {message, threadId} = req.body;
    
    if(!message || !threadId){
        res.json(400).json({message: "All fields are required!"});
        return
    }

    try {
        const result = await generate(message, threadId);
        res.json({message: result});
    } catch (error) {
        console.error('Error generating response:', error);
        res.status(500).json({error: 'Failed to generate response'});
    }
})

app.listen(port, () => {
  console.log(`Server app listening on port ${port}`)
});
