import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return(
   <div className='flex items-center justify-center min-h-screen w-full'>
       <section className='w-full max-w-3xl'>
         <SignUp />
       </section>
     </div>
  )
}
