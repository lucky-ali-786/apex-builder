import React from 'react'
import Projectview from '@/lib/projects/components/Projectview'
async function page({params}) {
    const {projectId}=await params
  return (
    <div>
      <Projectview projectId={projectId}></Projectview>
    </div>
  )
}

export default page
