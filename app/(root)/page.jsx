import React from 'react'
import Image from 'next/image'
import Projectform from '@/lib/home/components/Projectform'
import { Button } from '@/components/ui/button'
import { inngest } from '@/inngest/client'
import ProjectList from '@/lib/home/components/ProjectList'
function page() {
  return (
    <div className='flex items-center justify-center w-full px-4 py-8'>

      <div className='max-w-5xl w-full'>
        <section className='space-y-8 flex flex-col items-center'>
          <div className='flex flex-col items-center'>
            <Image
              src={"/logo.svg"}
              width={200}
              height={200}
              alt='Logo'
              className='hidden md:block invert dark:invert-0'
            />
          </div>
          <h1 className='text-2xl md:text-5xl font-bold text-center'>Build Something with 💖</h1>

          <p className='text-lg md:text-xl text-muted-foreground text-center'>
            Create apps and websites by chatting with AI
          </p>

          <div className='max-w-3xl w-full'>
          <Projectform/>
          </div>
          <ProjectList/>
        </section>

      </div>
    </div>
  )
}

export default page
