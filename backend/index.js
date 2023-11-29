import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';
import exceljs from 'exceljs';


const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());
const apiKey = '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'; 
const engine = 'text-davinci-003'; 
const embeddingEngine = 'text-embedding-ada-002'; 


const knowledgeBase = {};

// Function to upload PDFs and generate embeddings
const uploadPDF = async (pdfContent, pdfSection) => {
  // Simulate uploading PDF content to an Excel file
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet('Embeddings');
  worksheet.columns = [{ header: 'Section', key: 'section' }, { header: 'Embedding', key: 'embedding' }];
  worksheet.addRow({ section: pdfSection, embedding: await generateEmbeddings(pdfContent) });

  // Save the workbook
  await workbook.xlsx.writeFile('embeddings.xlsx');
};

// Function to generate embeddings for the PDF content
const generateEmbeddings = async (pdfContent) => {
  try {
    const result = await axios.post(
      'https://api.openai.com/v1/engines/' + embeddingEngine + '/completions',
      {
        prompt: pdfContent,
        max_tokens: 150,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    // Extract and return the embedding from the result
    return result.data.choices[0].text;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
};

// Function to find a matching section based on user input
const findMatchingSection = (userMessage) => {
  // Placeholder code: Simulate finding a matching section 
  const sections = Object.keys(knowledgeBase);
  for (const section of sections) {
    if (userMessage.toLowerCase().includes(section.toLowerCase())) {
      return section;
    }
  }
  return null;
};

app.post('/', async (request, response) => {
  const { chats } = request.body;

  try {
    // Get the user's message from the last chat entry
    const userMessage = chats[chats.length - 1].content;

    // Find a matching section in the knowledge base
    const matchedSection = findMatchingSection(userMessage);

    if (matchedSection) {
      // If a matching section is found, use the corresponding embedding
      const result = await axios.post(
        'https://api.openai.com/v1/engines/' + engine + '/completions',
        {
          prompt: 'You are a helpful assistant. User says: ' + userMessage,
          max_tokens: 150,
          embeddings: knowledgeBase[matchedSection], // Use the embedding for the matching section
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      response.json({
        output: result.data.choices[0].text,
      });
    } else {
      // If no matching section is found, provide a general response
      const result = await axios.post(
        'https://api.openai.com/v1/engines/' + engine + '/completions',
        {
          prompt: 'You are a helpful assistant. User says: ' + userMessage,
          max_tokens: 150,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      response.json({
        output: result.data.choices[0].text,
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
