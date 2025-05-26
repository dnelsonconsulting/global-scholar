"use client";

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ReturnToHome() {
  

  return (
    <>
      <Link href="/">
        <Button variant="secondary">Return to Home</Button>
      </Link>
    </>
  );
}