'use client'

import { useState, useEffect } from 'react'

// Simple cache to avoid repeated requests
const cache = new Map<string, { image?: string, twitter?: string, website?: string }>()

export const useImageFromUri = (uri: string | undefined, fallbackImage?: string) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(fallbackImage)
  const [loading, setLoading] = useState(false)
  const [socialLinks, setSocialLinks] = useState<{twitter?: string, website?: string}>({})

  useEffect(() => {
    if (!uri) {
      setImageUrl(fallbackImage)
      setSocialLinks({})
      return
    }

    // Check cache first
    if (cache.has(uri)) {
      const cached = cache.get(uri)!
      setImageUrl(cached.image || fallbackImage)
      setSocialLinks({ twitter: cached.twitter, website: cached.website })
      return
    }

    setLoading(true)

    const fetchFromUri = async () => {
      try {
        // Use our proxy API to avoid CORS issues
        const proxyUrl = `/api/proxy-metadata?url=${encodeURIComponent(uri)}`
        
        const response = await fetch(proxyUrl, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(8000)
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        // Our proxy always returns JSON
        const data = await response.json()
        
        let image: string | undefined = undefined
        let twitter: string | undefined = undefined
        let website: string | undefined = undefined

        // If URI looks like a direct image URL, use it
        if (uri.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
          image = uri
        } else {
          // Extract image from metadata
          image = data.image || data.image_url || data.logo || data.icon || 
                 data.avatar || data.picture || data.img || data.logoURI
          
          // Extract social links
          website = data.external_url || data.website || data.homepage || 
                   data.home_page || data.url
          
          twitter = data.twitter || data.twitter_url || 
                   data.social?.twitter || data.socials?.twitter || 
                   data.links?.twitter
          
          // Convert IPFS image URLs
          if (image && image.startsWith('ipfs://')) {
            image = image.replace('ipfs://', 'https://ipfs.io/ipfs/')
          }
          
          // Format Twitter URL
          if (twitter && !twitter.includes('http')) {
            const username = twitter.replace('@', '')
            twitter = `https://twitter.com/${username}`
          }
          
          // Convert x.com to twitter.com
          if (twitter && twitter.includes('x.com')) {
            twitter = twitter.replace('x.com', 'twitter.com')
          }
        }

        // Cache the result
        cache.set(uri, { image, twitter, website })
        
        setImageUrl(image || fallbackImage)
        setSocialLinks({ twitter, website })

      } catch (error) {
        cache.set(uri, {})
        setImageUrl(fallbackImage)
        setSocialLinks({})
      } finally {
        setLoading(false)
      }
    }

    fetchFromUri()
  }, [uri, fallbackImage])

  return { imageUrl, loading, socialLinks }
}