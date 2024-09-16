import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]"; // Import your auth options

export async function requireAuth(req, res, next) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    // Assuming the session object contains the username
    req.user = {
        id: session.user.id,
        email: session.user.email,
        username: session.user.username // Include username from session
    };

    console.log("User authenticated:", req.user); // Debug log
    next();
}