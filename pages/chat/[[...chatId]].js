import { getSession } from "@auth0/nextjs-auth0";
import { faRobot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChatSidebar } from "components/ChatSidebar";
import { Message } from "components/Message";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

export default function ChatPage({ chatId, title, messages = [] }) {
  console.log("props: ", title, messages);
  const [newChatId, setNewChatId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [incomingMessages, setIncomingMessages] = useState("");
  const [newChatMessages, setNewChatMessages] = useState([]);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setNewChatMessages([]);
    setNewChatId(null);
  }, [chatId]);

  useEffect(() => {
    if (!generatingResponse && newChatId) {
      setNewChatId(null);
      router.push(`/chat/${newChatId}`);
    }
  }, [newChatId, generatingResponse, router]);

  /**
   * 
   * {
  chat: {
  _id: '66b98a78f8ad277acb2f52e2',
  userId: 'auth0|66b8aef1ad17d03b156ef468',
  messages: [
  { role: 'user', content: 'what is Himalaya?' },
  {
  role: 'assistant',
  content: 'Himalaya is a massive mountain range in Asia, separating the plains of the Indian subcontinent from the Tibetan Plateau. It is home to some of the world\'s highest peaks, including Mount Everest, the tallest mountain on Earth. The Himalayas are a source of numerous rivers and play a significant'
}
],
  title: 'what is Himalaya?'
}
}
   */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneratingResponse(true);
    setNewChatMessages((prev) => [
      ...prev,
      {
        _id: uuid(),
        role: "user",
        content: messageText,
      },
    ]);
    setMessageText(""); // setting the message text to empty after sending the message
    console.log("MESSAGE:", messageText);

    const response = await fetch("/api/chat/sendMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: messageText }),
    });
    const data = await response.json();
    console.log("DATA:", data);
    if (!data) {
      console.error("No data received");
      return;
    }
    setNewChatId(data.chat._id);
    console.log("RESPONSE:", data.message);
    let content = "";
    data.chat.messages.forEach((message) => {
      if (message.role === "assistant") content += message.content + "\n";
    });
    setIncomingMessages((prev) => prev + "\n" + content);

    setIncomingMessages("");
    setGeneratingResponse(false);
  };

  const allChatMessages = [...messages, ...newChatMessages];

  return (
    <>
      <Head>
        <title>New Chat</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr]">
        <ChatSidebar chatId={chatId} />
        <div className="flex flex-col overflow-hidden bg-gray-700">
          <div className="flex flex-1 flex-col-reverse overflow-scroll text-white">
            {!allChatMessages.length && !incomingMessages && (
              <div className="m-auto flex items-center justify-center text-center">
              <div>
                <FontAwesomeIcon
                  icon={faRobot}
                  className="text-6xl text-emerald-200"
                />
                <h1 className="mt-2 text-4xl font-bold text-white/50">
                  Ask me a question!
                </h1>
              </div>
            </div>
            )}
            {!!allChatMessages.length && (
              <div className="mb-auto">
                {allChatMessages.map((message) => (
                  <Message
                    key={message._id}
                    role={message.role}
                    content={message.content}
                  />
                ))}
                {!!incomingMessages && (
                  <Message role="assistant" content={incomingMessages} />
                )}
              </div>
            )}
          </div>
          <footer className="bg-gray-800 p-10">
            <form onSubmit={handleSubmit}>
              <fieldset className="flex gap-2" disabled={generatingResponse}>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={generatingResponse ? "" : "Send a message ..."}
                  className="focus: w-full resize-none rounded-md border-emerald-500 bg-gray-700 p-2 text-white focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                />
                <button type="submit" className="btn">
                  Send
                </button>
              </fieldset>
            </form>
          </footer>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps = async (ctx) => {
  const chatId = ctx.params?.chatId?.[0] || null;
  if (chatId) {
    let objectId;

    try {
      objectId = new ObjectId(chatId);
    } catch (e) {
      return {
        redirect: {
          destination: "/chat",
        },
      };
    }

    const { user } = await getSession(ctx.req, ctx.res);
    const client = await clientPromise;
    const db = client.db("ChattyNabjo");
    const chat = await db.collection("chats").findOne({
      userId: user.sub,
      _id: objectId,
    });

    if (!chat) {
      return {
        redirect: {
          destination: "/chat",
        },
      };
    }

    return {
      props: {
        chatId,
        title: chat.title,
        messages: chat.messages.map((message) => ({
          ...message,
          _id: uuid(),
        })),
      },
    };
  }
  return {
    props: {},
  };
};
