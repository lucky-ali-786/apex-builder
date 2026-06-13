import React from 'react';
import Link from 'next/link';
// Dhyan de: Yahan SignedIn/SignedOut ki jagah hum 'Show' import kar rahe hain
import { Show, SignInButton, UserButton, SignUpButton } from "@clerk/nextjs";
import { Button } from '@/components/ui/button';
import Image from 'next/image';
function Navbar() {
    return (
        <nav className="top-0 left-0 p-4 right-0 bg-transparent fixed z-50 transition-all duration-200 border-b border-transparent">
            <div className='max-w-5xl mx-auto w-full flex justify-between items-center'>

                <Link href={"/"} className='flex items-center gap-2'>
                   <Image src={"/logo.svg"} alt='Apex' width={80} height={80} className='shrink-0 invert dark:invert-0'/>
                </Link>

                <Show when="signed-out">
                    <div className='flex gap-2'>
                        <SignInButton mode="modal">
                            <Button variant="outline" size="sm">
                                Sign In
                            </Button>
                        </SignInButton>

                        <SignUpButton mode="modal">
                            <Button size="sm">
                                Sign Up
                            </Button>
                        </SignUpButton>
                    </div>
                </Show>

                {/* Yeh sirf tab dikhega jab user logged IN ho */}
                <Show when="signed-in">
                    <UserButton />
                </Show>

            </div>
        </nav>
    );
}

export default Navbar;
