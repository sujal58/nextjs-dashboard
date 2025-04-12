import NextAuth, { CredentialsSignin } from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from 'next-auth/providers/credentials'
import { z } from "zod";
import postgres from "postgres";
import { User } from "./app/lib/definitions";
import bcrypt from "bcryptjs";


const sql = postgres(process.env.POSTGRES_URL!);

async function getUser(email:string): Promise<User | undefined>{
    try {
        const user = await sql<User[]>`SELECT * FROM users WHERE email = ${email}`;
        return user[0];
    } catch (error) {
        console.log('Failed to fetch user: ', error);
        throw new Error('Failed to fetch User.')
    }
}

export const {auth, signIn, signOut} = NextAuth({
    ...authConfig,
    providers:[Credentials({
        async authorize(credentials){
            const parsedCrediatials = z.object({
                email: z.string().email(),
                password: z.string().min(6)
            }).safeParse(credentials)

            if(parsedCrediatials.success){
                const {email, password} = parsedCrediatials.data;

                const user = await getUser(email);
                if(!user) return null;

                const passwordMatch = await bcrypt.compare(password, user.password);
                if(passwordMatch) return user;
            }
            console.log("Invalid Credentials");

            return null;
        }
    })]
})