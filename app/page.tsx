'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

interface Portfolio {
  author: {
    name: string
    title: string
    avatar: string
    location: string
    email: string
    ctaText: string
    ctaUrl: string
    roles: string[]
    biography: string
  }
}

export default function Home() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)

  useEffect(() => {
    fetch('/data/portfolio.json')
      .then(res => res.json())
      .then(data => setPortfolio(data))
  }, [])

  if (!portfolio) return null

  const { author } = portfolio

  return (
    <main className="min-h-screen">
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
        {/* Left side - Image */}
        <div className="relative hidden md:block">
          <Image
            src={`/${author.avatar}`}
            alt={author.name}
            fill
            priority
            className="object-cover"
          />
        </div>

        {/* Right side - Content */}
        <div className="flex flex-col justify-center px-8 py-12 md:px-12 lg:px-16">
          <div className="max-w-lg">
            <p className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wide">
              {author.location}
            </p>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-2 text-balance">
              {author.name}
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              {author.title}
            </p>

            <p className="text-base md:text-lg leading-relaxed text-gray-700 mb-10">
              {author.biography.split('\n\n')[0]}
            </p>

            <a
              href={author.ctaUrl}
              className="inline-block px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              {author.ctaText}
            </a>
          </div>
        </div>

        {/* Mobile fallback - Image below content */}
        <div className="md:hidden relative h-96 w-full">
          <Image
            src={`/${author.avatar}`}
            alt={author.name}
            fill
            priority
            className="object-cover"
          />
        </div>
      </section>
    </main>
  )
}
