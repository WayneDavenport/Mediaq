import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]"; // Import your auth options

export async function requireAuth(req, res, next) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = { id: session.user.id, email: session.user.email };
    console.log("User authenticated:", req.user); // Debug log
    next();
}