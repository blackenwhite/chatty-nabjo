import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
    try{
        const { user } = await getSession(req, res);
        const client = await clientPromise;
        const db = client.db("ChattyNabjo");

        const { chatId, role, content } = req.body;

        const chat = await db.collection("chats").findOneAndUpdate({
            _id: new ObjectId(chatId),
            userId: user.sub,
        },
        {
            $push: {
                messages: {
                    role,
                    content
                }
            }
        },
        {
            returnDocument: "after"
        }
    );

    res.status(200).json({
        chat: {
            ...chat.value,
            _id: chat.value._id.toString(),
        }
    });
    } catch (error) {
        console.error("Error occured while adding message to chat: ", error);
        return new Response(JSON.stringify({ error: "Error from GPT" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
}