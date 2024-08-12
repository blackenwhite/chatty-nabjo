import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      message: "This method is not allowed.",
    });
  }
  try {
    const { user } = await getSession(req, res);
    const client = await clientPromise;
    const db = client.db("ChattyNabjo");
    const chats = await db
      .collection("chats")
      .find({ userId: user.sub }, { projection: { userId: 0, messages: 0 } })
      .sort({ _id: -1 })
      .toArray();

    res.status(200).json({ chats });
  } catch (e) {
    res.status(500).json({
      message: "An error occured when getting the chat list.",
    });
    console.log("ERROR OCCURED IN GETTING THE CHAT LIST: ", e);
  }
}
