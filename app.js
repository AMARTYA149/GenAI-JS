import "dotenv/config";
import { tavily } from "@tavily/core";
import OpenAI from "openai";
import readline from 'node:readline/promises'

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const apiKey = process.env.GROQ_API_KEY;

const groq = new OpenAI({
  apiKey: apiKey,
  baseURL: "https://api.groq.com/openai/v1",
});

async function main() {

    const rl = readline.createInterface({input: process.stdin, output: process.stdout});

  const messages = [
    {
      //Setting persona of the llm agent
      role: "system",
      content: `You are Jarvis, a smart personal assistant. You MUST ALWAYS respond in Hinglish (mix of Hindi and English). Be a chaddi buddy - casual, friendly, desi tone. NEVER mention or reference your tools/functions in your responses. Current date and time: ${new Date().toUTCString()}`,
    }
    // {
    //   role: "user",
    //   content: "What is the weather in Manali?",
    // },
  ];

  while(true){

    const question = await rl.question('You: ');

    if(question.toLowerCase().includes('bye')){
        break;
    }

    messages.push({
        role: "user",
        content: question
    });

    while (true) {
    const completions = await groq.chat.completions.create({
      temperature: 0,
      // frequency_penalty: 1,
      // response_format: { type: 'json_object' },
      model: "llama-3.3-70b-versatile",
      messages: messages,
      tools: [
        // Sample request body with tool definitions and messages
        {
          type: "function",
          function: {
            name: "webSearch",
            description:
              "Search the latest information and realtime data on the internet",
            parameters: {
              // JSON Schema object
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query to perform search on",
                },
              },
              required: ["query"],
            },
          },
        },
      ],
      tool_choice: "auto",
      parallel_tool_calls: false
    });

    messages.push(completions.choices[0].message);
    // console.log(`Messages ${messages}`);

    const toolCalls = completions.choices[0].message.tool_calls;
    if (!toolCalls) {
      console.log(`Assistant: ${completions.choices[0].message.content} \n`);
      break;
    }

    for (const tool of toolCalls) {
    //   console.log(`tool:`, tool);
      const functionName = tool.function.name;
      const functionParams = tool.function.arguments;

      if (functionName === "webSearch") {
        const toolResult = await webSearch(JSON.parse(functionParams));
        // console.log(`ToolResult: `, toolResult);

        messages.push({
          tool_call_id: tool.id,
          role: "tool",
          name: functionName,
          content: toolResult,
        });
      }
    }

    //    const completions2 = await groq.chat.completions.create({
    //     temperature: 0,
    //     // frequency_penalty: 1,
    //     // response_format: { type: 'json_object' },
    //     model: 'llama-3.3-70b-versatile',
    //     messages: messages,
    //     tools: [
    //         // Sample request body with tool definitions and messages
    //         {
    //             "type": "function",
    //             "function": {
    //                 "name": "webSearch",
    //                 "description": "Search the latest information and realtime data on the internet",
    //                 "parameters": {
    //                     // JSON Schema object
    //                     "type": "object",
    //                     "properties": {
    //                         "query": {
    //                             "type": "string",
    //                             "description": "The search query to perform search on"
    //                         }
    //                     },
    //                     "required": ["query"]
    //                 }
    //             }
    //         }

    //     ],
    //     tool_choice: 'auto'
    // });

    // console.log("Response:", JSON.stringify(completions2.choices[0].message, null, 2));
  }
  }

  rl.close();
}

main();

async function webSearch({ query }) {
  // Here we will do tavily api call

  console.log(`Calling web search...`);

  const response = await tvly.search(query);
  // console.log(`Response: `, response);

  const finalResult = response.results
    .map((result) => result.content)
    .join("\n\n");

  // console.log(`Final Result: ${finalResult}`)
  return finalResult;
}
