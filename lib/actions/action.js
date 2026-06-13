"use server"
import { currentUser } from "@clerk/nextjs/server"
import prisma from "../db.js"
import { inngest } from "@/inngest/client.js"
// for making a reading in db for login 
export async function onBoarduser(){
    try {
        const user=await currentUser()
        if(!user){
            return {
                success:false,
                message:"user is not authenticated !!"
            }
        }
        const {id,lastName,firstName,imageUrl,emailAddresses}=user;
        const newuser=await prisma.user.upsert({
            where:{
                clerkId:id
            },
            update:{
                name:firstName&&lastName?
                `${firstName} ${lastName}`:firstName,
                image:imageUrl||null,
                email:emailAddresses[0]?.emailAddress|| ""
            },
            create:{
                clerkId:id,
                name:firstName&&lastName?
                `${firstName} ${lastName}`:firstName,
                image:imageUrl||null,
                email:emailAddresses[0]?.emailAddress|| ""
            }
        })
        return {
            success:true,
            user:newuser,
            message:"the user fetched successfully"
        }

    } catch (error) {
        console.log(error)
        return {
            success:false,
            message:error.message
        }
    }

}
export async function getcurruser(){
    try {
        const user=await currentUser();
         if(!user){
            return {
                success:false,
                message:"user is not authenticated !!"
            }
        }
        const {id}=user;
        const curruser=await prisma.user.findUnique({
            where:{
                clerkId:id
            },
            select:{
                name:true,
                email:true,
                image:true,
                id:true,
                clerkId:true
            }
        })
        return {
            success:true,
            user:curruser
        }
        
    } catch (error) {
        console.log(error)
        return {
            success:false,
            msg:"error occured"
        }
    }
}
export async function Invoke(){
  
   await inngest.send({
    name:"agent/hello"
   })
  
}