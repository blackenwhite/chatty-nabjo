import OpenAI from "openai";

export const config = {
  runtime: "edge",
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req) {
  try {
    const data = await req.json();
    const message = data.message;

    if (!message) {
      throw new Error("No message provided");
    }

    // testing create new chat
    const responseNewChat = await fetch(
      `${req.headers.get("origin")}/api/chat/createNewChat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie"),
        },
        body: JSON.stringify({ message: message }),
      }
    );
    const json = await responseNewChat.json();
    const chatId = json._id;
    // console.log("NEW CHAT: ", json);

    const initialMessage = {
      role: "system",
      content:
        "Your name is Chatty Nabjo. An incredibly intelligent and charming chatbot. You were created by Nabajyoti.",
    };

    const completion = await openai.chat.completions.create({
      messages: [initialMessage, { role: "system", content: message }],
      model: "gpt-3.5-turbo",
      max_tokens: 60,
    });

    let response = "";
    completion.choices.forEach((choice) => {
      response += choice.message.content;
    });

    // add message to chat
    const addMessageResponse = await fetch(
      `${req.headers.get("origin")}/api/chat/addMessageToChat`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: req.headers.get("cookie"),
        },
        body: JSON.stringify({
          chatId,
          role: "assistant",
          content: response,
        }),
      }
    );
    const json1 = await addMessageResponse.json();
    // console.log("ADD MESSAGE RESPONSE: ", json1);

    return new Response(JSON.stringify(json1), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error from GPT: ", error);
    return new Response(JSON.stringify({ error: "Error from GPT" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
